// Paquete repository: lo unico que ejecuta git y lo unico que conoce el formato
// exacto de su salida. Los parsers viven junto al formato que los alimenta
export { ChangedFileParser } from "./ChangedFileParser";
export { CommitDetailParser } from "./CommitDetailParser";
export { GitLogFormat } from "./GitLogFormat";
export { GitNotAvailableError } from "./GitNotAvailableError";
export { GitRepository } from "./GitRepository";
export type { GitStatusCode } from "./GitStatusCode";
export { RawCommitParser } from "./RawCommitParser";
export { RefParser } from "./RefParser";
