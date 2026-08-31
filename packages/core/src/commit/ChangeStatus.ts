// Tipo de cambio que un commit aplica sobre un archivo
export type ChangeStatus =
  | "added"
  | "modified"
  | "deleted"
  | "renamed"
  | "copied"
  | "typeChanged";
