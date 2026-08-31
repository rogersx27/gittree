import type { ChangedFile } from "./ChangedFile";
import type { CommitHash } from "./CommitHash";
import type { Person } from "./Person";

// Todo lo que se lee de un commit bajo demanda, al seleccionarlo
export interface CommitDetail {
  readonly hash: CommitHash;
  readonly parents: readonly CommitHash[];
  readonly author: Person;
  readonly authoredAt: string;
  readonly committer: Person;
  readonly committedAt: string;
  readonly subject: string;
  readonly body: string;
  readonly isMerge: boolean;
  readonly files: readonly ChangedFile[];
}
