import type { ColorIndex } from "./ColorIndex";
import type { EdgeKind } from "./EdgeKind";
import type { Lane } from "./Lane";
import type { Row } from "./Row";

// Como se conecta un commit con uno de sus padres. toRow es null cuando el padre
// no esta en el conjunto cargado (clon shallow o limite alcanzado): la arista se
// dibuja saliendo por abajo, sin destino
export interface LaneEdge {
  readonly fromRow: Row;
  readonly fromLane: Lane;
  readonly toRow: Row | null;
  readonly toLane: Lane;
  readonly colorIndex: ColorIndex;
  readonly kind: EdgeKind;
}
