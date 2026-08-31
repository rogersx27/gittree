import type { RepoErrorCode } from "./RepoErrorCode";

// Todo lo que puede fallar en una peticion: los fallos de repositorio, mas los
// que solo existen a nivel HTTP
export type ApiErrorCode = RepoErrorCode | "BAD_REQUEST" | "COMMIT_NOT_FOUND";
