import type { ChangedFile, ChangeStatus } from "../commit";
import type { GitStatusCode } from "./GitStatusCode";

// Record sobre la union cerrada, no sobre string: el compilador exige que
// esten los seis codigos, y al indexar con un GitStatusCode ya validado el
// resultado es un ChangeStatus, sin el undefined que obliga a comprobar
const STATUS_BY_CODE: Readonly<Record<GitStatusCode, ChangeStatus>> = {
  A: "added",
  M: "modified",
  D: "deleted",
  R: "renamed",
  C: "copied",
  T: "typeChanged",
};

// Solo estos dos traen dos rutas: la antigua y la nueva
const RENAME_CODES: ReadonlySet<GitStatusCode> = new Set<GitStatusCode>([
  "R",
  "C",
]);

// git pega un porcentaje de similitud al codigo de renombrado (R100, C85), de
// ahi que se mire solo la primera letra
const codeOf = (token: string): GitStatusCode | null => {
  const letter = token.charAt(0);
  return letter in STATUS_BY_CODE ? (letter as GitStatusCode) : null;
};

// Estado del recorrido de tokens al reconstruir la lista de archivos
interface FileScan {
  readonly files: ChangedFile[];
  readonly code: string | null;
  readonly previousPath: string | null;
}

// Traduce la salida de git show --name-status -z a archivos tipados.
export class ChangedFileParser {
  // Utilidad sin estado: no se instancia
  private constructor() {}

  // Reconstruye la lista desde el flujo NUL de --name-status -z, que llega como
  // "M\0ruta\0" y, en renombrados, como "R100\0antigua\0nueva\0"
  static parse(raw: string): readonly ChangedFile[] {
    return raw
      .split("\0")
      .filter((token) => token !== "")
      .reduce<FileScan>(ChangedFileParser.consume, {
        files: [],
        code: null,
        previousPath: null,
      }).files;
  }

  // Absorbe un token y devuelve el estado del recorrido tras el
  private static consume(scan: FileScan, token: string): FileScan {
    // Primer token del grupo: es el codigo de estado
    if (scan.code === null) {
      return { ...scan, code: token };
    }

    const code = codeOf(scan.code);
    if (code === null) {
      // Codigo desconocido: se descarta el grupo y se sigue leyendo
      return { files: scan.files, code: null, previousPath: null };
    }

    // El indexado ya no puede devolver undefined: code es uno de los seis
    const status = STATUS_BY_CODE[code];

    // Un renombrado trae dos rutas: la primera se guarda y se espera a la otra
    if (RENAME_CODES.has(code) && scan.previousPath === null) {
      return { ...scan, previousPath: token };
    }

    scan.files.push(
      scan.previousPath === null
        ? { status, path: token }
        : { status, path: token, previousPath: scan.previousPath },
    );
    return { files: scan.files, code: null, previousPath: null };
  }
}
