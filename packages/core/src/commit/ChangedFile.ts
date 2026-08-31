import type { ChangeStatus } from "./ChangeStatus";

// Un archivo tocado por un commit. previousPath solo existe en rename y copy
export interface ChangedFile {
  readonly status: ChangeStatus;
  readonly path: string;
  readonly previousPath?: string;
}
