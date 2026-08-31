import type { CommitNode } from "./CommitNode";
import type { LaneEdge } from "./LaneEdge";

// Resultado completo del engine: puro, serializable y comparable en un test
export interface GraphLayout {
  readonly nodes: readonly CommitNode[];
  readonly edges: readonly LaneEdge[];
  readonly laneCount: number;
  readonly rowCount: number;
}
