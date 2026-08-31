import type { CommitHash } from "../commit";
import type { ColorIndex } from "./ColorIndex";
import type { Lane } from "./Lane";
import type { Row } from "./Row";

// Un commit ya posicionado en la rejilla del grafo. Los tres numeros van
// marcados: son lo bastante parecidos como para cruzarse sin querer
export interface CommitNode {
  readonly hash: CommitHash;
  readonly row: Row;
  readonly lane: Lane;
  readonly colorIndex: ColorIndex;
}
