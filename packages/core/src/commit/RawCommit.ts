import type { Ref } from "../ref";
import type { CommitHash } from "./CommitHash";
import type { Person } from "./Person";

// Un commit tal y como lo devuelve git log, ya parseado pero sin posicionar
export interface RawCommit {
  readonly hash: CommitHash;
  readonly parents: readonly CommitHash[];
  readonly refs: readonly Ref[];
  readonly author: Person;
  readonly authoredAt: string;
  readonly subject: string;
}
