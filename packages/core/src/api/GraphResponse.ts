import type { RawCommit } from "../commit";
import type { GraphLayout } from "../layout";

// commits[i] y layout.nodes[i] describen el mismo commit: van alineados por
// indice, para que el cliente no tenga que hacer un join por hash
export interface GraphResponse {
  readonly repoPath: string;
  readonly commits: readonly RawCommit[];
  readonly layout: GraphLayout;
  // true si se alcanzo el limite y el historial esta truncado
  readonly truncated: boolean;
}
