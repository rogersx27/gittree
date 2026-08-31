// Motivos por los que una ruta no sirve como repositorio
export type RepoErrorCode =
  | "NOT_FOUND"
  | "NOT_A_REPO"
  | "EMPTY_REPO"
  | "GIT_MISSING";
