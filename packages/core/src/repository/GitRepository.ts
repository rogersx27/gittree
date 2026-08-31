import { simpleGit, type SimpleGit } from "simple-git";
import type { ChangedFile, CommitDetail, CommitHash, RawCommit } from "../commit";
import { ChangedFileParser } from "./ChangedFileParser";
import { CommitDetailParser } from "./CommitDetailParser";
import { GitLogFormat } from "./GitLogFormat";
import { GitNotAvailableError } from "./GitNotAvailableError";
import { RawCommitParser } from "./RawCommitParser";

// Un fallo al arrancar el proceso, no un fallo del comando que se le pidio
const isGitMissing = (error: unknown): boolean =>
  error instanceof Error && /ENOENT|spawn git/i.test(error.message);

// Unica pieza que ejecuta git. No sabe nada de lanes, colores ni HTTP: lo que
// git devuelve se lo entrega tal cual a los parsers de este mismo paquete.
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
      `--pretty=format:${GitLogFormat.GRAPH}`,
      `--max-count=${limit}`,
    ]);

    return RawCommitParser.parseLog(raw);
  }

  // Detalle de un commit. Son dos llamadas a proposito: mezclar la cabecera y
  // el flujo NUL de --name-status en un solo formato es fragil de parsear
  async readCommitDetail(hash: CommitHash): Promise<CommitDetail> {
    const [header, files] = await Promise.all([
      this.git.raw([
        "show",
        "-s",
        `--pretty=format:${GitLogFormat.DETAIL}`,
        // Segunda barrera, independiente del tipo: a partir de aqui git trata
        // lo que venga como revision y nunca como opcion, aunque empiece por
        // guion. El tipo ya lo garantiza; esto lo garantiza tambien si alguien
        // relaja el tipo algun dia
        "--end-of-options",
        hash,
      ]),
      this.readChangedFiles(hash),
    ]);

    return CommitDetailParser.parse(header, files, hash);
  }

  // --first-parent y -m son obligatorios: sin ellos git suprime el diff de los
  // merges y --name-status devuelve cero lineas, con lo que un merge apareceria
  // sin archivos en la interfaz
  private async readChangedFiles(
    hash: CommitHash,
  ): Promise<readonly ChangedFile[]> {
    const raw = await this.git.raw([
      "show",
      "--name-status",
      "--first-parent",
      "-m",
      "--find-renames",
      "-z",
      "--pretty=format:",
      // Todas las opciones tienen que ir antes de esta barrera
      "--end-of-options",
      hash,
    ]);
    return ChangedFileParser.parse(raw);
  }
}
