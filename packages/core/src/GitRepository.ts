import { simpleGit, type SimpleGit } from "simple-git";
import { parseRefs } from "./refs";
import type {
  ChangedFile,
  ChangeStatus,
  CommitDetail,
  Person,
  RawCommit,
} from "./types";

// Separador de campos: US (unit separator). Ni el, ni el NUL que separa
// registros, pueden aparecer dentro de un mensaje de commit
const UNIT = "\x1f";

// hash, padres, refs, autor, email, fecha ISO, asunto
const GRAPH_FORMAT = ["%H", "%P", "%D", "%an", "%ae", "%aI", "%s"].join("%x1f");

// Igual, mas committer y cuerpo. %b va el ultimo porque contiene saltos de linea
const DETAIL_FORMAT = [
  "%H",
  "%P",
  "%an",
  "%ae",
  "%aI",
  "%cn",
  "%ce",
  "%cI",
  "%s",
  "%b",
].join("%x1f");

// Codigos de --name-status. R y C llegan con un porcentaje de similitud pegado
// (R100, C85), de ahi que se mire solo la primera letra
const STATUS_BY_CODE: Readonly<Record<string, ChangeStatus>> = {
  A: "added",
  M: "modified",
  D: "deleted",
  R: "renamed",
  C: "copied",
  T: "typeChanged",
};

const RENAME_CODES = new Set(["R", "C"]);

// Estado del recorrido de tokens al reconstruir la lista de archivos
interface FileScan {
  readonly files: ChangedFile[];
  readonly code: string | null;
  readonly previousPath: string | null;
}

// git no esta en el PATH: es distinto de que el comando falle, y el usuario
// necesita saberlo para arreglarlo
export class GitNotAvailableError extends Error {
  constructor() {
    super("No se encuentra el ejecutable de git en el PATH del sistema.");
    this.name = "GitNotAvailableError";
  }
}

// Un fallo al arrancar el proceso, no un fallo del comando que se le pidio
const isGitMissing = (error: unknown): boolean =>
  error instanceof Error && /ENOENT|spawn git/i.test(error.message);

const person = (name: string, email: string): Person => ({ name, email });

// Reconstruye la lista de archivos desde el flujo NUL de --name-status -z, que
// llega como "M\0ruta\0" y, en renombrados, como "R100\0antigua\0nueva\0"
const parseChangedFiles = (raw: string): readonly ChangedFile[] =>
  raw
    .split("\0")
    .filter((token) => token !== "")
    .reduce<FileScan>(
      (scan, token) => {
        // Primer token del grupo: es el codigo de estado
        if (scan.code === null) {
          return { ...scan, code: token };
        }

        const status = STATUS_BY_CODE[scan.code.charAt(0)];
        if (status === undefined) {
          // Codigo desconocido: se descarta el grupo y se sigue leyendo
          return { files: scan.files, code: null, previousPath: null };
        }

        // Un renombrado trae dos rutas: la primera se guarda y se espera a la otra
        if (RENAME_CODES.has(scan.code.charAt(0)) && scan.previousPath === null) {
          return { ...scan, previousPath: token };
        }

        scan.files.push(
          scan.previousPath === null
            ? { status, path: token }
            : { status, path: token, previousPath: scan.previousPath },
        );
        return { files: scan.files, code: null, previousPath: null };
      },
      { files: [], code: null, previousPath: null },
    ).files;

// Convierte un registro de git log en un commit tipado, o null si viene
// incompleto (no deberia ocurrir, pero el parseo no puede confiar en la forma)
const parseGraphRecord = (record: string): RawCommit | null => {
  const [hash, parents, decoration, authorName, authorEmail, authoredAt, subject] =
    record.split(UNIT);

  if (
    hash === undefined ||
    parents === undefined ||
    decoration === undefined ||
    authorName === undefined ||
    authorEmail === undefined ||
    authoredAt === undefined
  ) {
    return null;
  }

  return {
    hash,
    // %P llega vacio en la raiz del historial
    parents: parents === "" ? [] : parents.split(" "),
    refs: parseRefs(decoration),
    author: person(authorName, authorEmail),
    authoredAt,
    subject: subject ?? "",
  };
};

// Unica pieza que habla con git. No sabe nada de lanes, colores ni HTTP.
export class GitRepository {
  private readonly git: SimpleGit;

  // La ruta llega ya validada por RepositoryResolver
  constructor(private readonly repoPath: string) {
    this.git = simpleGit({ baseDir: repoPath, maxConcurrentProcesses: 4 });
  }

  get path(): string {
    return this.repoPath;
  }

  // true si la ruta esta dentro de un repositorio git. Lanza solo cuando el
  // problema es que git no existe, porque eso no lo arregla cambiar de carpeta
  static async isRepository(path: string): Promise<boolean> {
    return GitRepository.probe(path, ["rev-parse", "--git-dir"]);
  }

  // Un repositorio recien creado existe pero no tiene HEAD resoluble
  static async hasCommits(path: string): Promise<boolean> {
    return GitRepository.probe(path, ["rev-parse", "--verify", "HEAD"]);
  }

  private static async probe(path: string, args: string[]): Promise<boolean> {
    try {
      await simpleGit({ baseDir: path }).raw(args);
      return true;
    } catch (error) {
      if (isGitMissing(error)) throw new GitNotAvailableError();
      return false;
    }
  }

  // Historial en orden topologico, con padres y refs resueltos en una sola
  // llamada. Se listan las refs una a una en vez de usar --all porque --all
  // arrastra refs/stash, que aporta commits ajenos al historial
  async readGraph(limit: number): Promise<readonly RawCommit[]> {
    const raw = await this.git.raw([
      "log",
      "--branches",
      "--tags",
      "--remotes",
      "HEAD",
      "--topo-order",
      // Sin esto, "feature/x" y "origin/x" son indistinguibles: ambas llevan barra
      "--decorate=full",
      "-z",
      `--pretty=format:${GRAPH_FORMAT}`,
      `--max-count=${limit}`,
    ]);

    return raw
      .split("\0")
      .filter((record) => record !== "")
      .map(parseGraphRecord)
      .filter((entry): entry is RawCommit => entry !== null);
  }

  // Detalle de un commit. Son dos llamadas a proposito: mezclar la cabecera y
  // el flujo NUL de --name-status en un solo formato es fragil de parsear
  async readCommitDetail(hash: string): Promise<CommitDetail> {
    const [header, files] = await Promise.all([
      this.git.raw(["show", "-s", `--pretty=format:${DETAIL_FORMAT}`, hash]),
      this.readChangedFiles(hash),
    ]);

    const [
      fullHash,
      parents,
      authorName,
      authorEmail,
      authoredAt,
      committerName,
      committerEmail,
      committedAt,
      subject,
      body,
    ] = header.split(UNIT);

    if (fullHash === undefined || parents === undefined) {
      throw new Error(`No se pudo leer el commit ${hash}`);
    }

    const parentList = parents === "" ? [] : parents.split(" ");

    return {
      hash: fullHash,
      parents: parentList,
      author: person(authorName ?? "", authorEmail ?? ""),
      authoredAt: authoredAt ?? "",
      committer: person(committerName ?? "", committerEmail ?? ""),
      committedAt: committedAt ?? "",
      subject: subject ?? "",
      body: (body ?? "").trim(),
      isMerge: parentList.length > 1,
      files,
    };
  }

  // --first-parent y -m son obligatorios: sin ellos git suprime el diff de los
  // merges y --name-status devuelve cero lineas, con lo que un merge apareceria
  // sin archivos en la interfaz
  private async readChangedFiles(hash: string): Promise<readonly ChangedFile[]> {
    const raw = await this.git.raw([
      "show",
      hash,
      "--name-status",
      "--first-parent",
      "-m",
      "--find-renames",
      "-z",
      "--pretty=format:",
    ]);
    return parseChangedFiles(raw);
  }
}
