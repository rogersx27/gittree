import { CommitHash, type ChangedFile, type CommitDetail } from "../commit";
import { GitLogFormat } from "./GitLogFormat";

// Traduce la cabecera de git show con GitLogFormat.DETAIL a un commit completo.
export class CommitDetailParser {
  // Utilidad sin estado: no se instancia
  private constructor() {}

  // Los archivos llegan aparte: se leen con otra llamada a git, porque mezclar
  // la cabecera y el flujo NUL de --name-status en un solo formato es fragil.
  // requestedHash solo se usa para el mensaje de error: el hash del resultado
  // es el que devuelve git, ya expandido a su forma larga
  static parse(
    header: string,
    files: readonly ChangedFile[],
    requestedHash: CommitHash,
  ): CommitDetail {
    const [
      hash,
      parents,
      authorName,
      authorEmail,
      authoredAt,
      committerName,
      committerEmail,
      committedAt,
      subject,
      body,
    ] = header.split(GitLogFormat.UNIT);

    if (hash === undefined || parents === undefined) {
      throw new Error(`No se pudo leer el commit ${requestedHash}`);
    }

    const parentList =
      parents === "" ? [] : parents.split(" ").map(CommitHash.unchecked);

    return {
      // git ya lo ha expandido a su forma larga y hexadecimal
      hash: CommitHash.unchecked(hash),
      parents: parentList,
      author: { name: authorName ?? "", email: authorEmail ?? "" },
      authoredAt: authoredAt ?? "",
      committer: { name: committerName ?? "", email: committerEmail ?? "" },
      committedAt: committedAt ?? "",
      subject: subject ?? "",
      body: (body ?? "").trim(),
      isMerge: parentList.length > 1,
      files,
    };
  }
}
