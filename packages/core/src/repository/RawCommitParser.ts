import { CommitHash, type RawCommit } from "../commit";
import { GitLogFormat } from "./GitLogFormat";
import { RefParser } from "./RefParser";

// Traduce la salida de git log con GitLogFormat.GRAPH a commits tipados.
export class RawCommitParser {
  // Utilidad sin estado: no se instancia
  private constructor() {}

  // El log completo llega como registros separados por NUL
  static parseLog(raw: string): readonly RawCommit[] {
    return raw
      .split("\0")
      .filter((record) => record !== "")
      .map(RawCommitParser.parseRecord)
      .filter((entry): entry is RawCommit => entry !== null);
  }

  // Un registro suelto, o null si viene incompleto (no deberia ocurrir, pero el
  // parseo no puede confiar en la forma de lo que le llega)
  private static parseRecord(record: string): RawCommit | null {
    const [
      hash,
      parents,
      decoration,
      authorName,
      authorEmail,
      authoredAt,
      subject,
    ] = record.split(GitLogFormat.UNIT);

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
      // git emite %H y %P en hexadecimal: no hay nada que validar aqui
      hash: CommitHash.unchecked(hash),
      // %P llega vacio en la raiz del historial
      parents:
        parents === "" ? [] : parents.split(" ").map(CommitHash.unchecked),
      refs: RefParser.parse(decoration),
      author: { name: authorName, email: authorEmail },
      authoredAt,
      subject: subject ?? "",
    };
  }
}
