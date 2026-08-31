import { MinHeap } from "../collection";
import type { NonEmptyArray, ReadonlyNonEmptyArray } from "../common";
import type { CommitGraph, CommitHash } from "../commit";
import { ColorIndex } from "./ColorIndex";
import type { CommitNode } from "./CommitNode";
import type { EdgeKind } from "./EdgeKind";
import type { GraphLayout } from "./GraphLayout";
import { Lane } from "./Lane";
import type { LaneEdge } from "./LaneEdge";
import { Row } from "./Row";

// Numero de colores del ciclo. El engine solo emite indices: los valores
// concretos son cosa del renderer, que es quien sabe de pintar
const DEFAULT_PALETTE_SIZE = 10;

// Arista pendiente de resolver. En la pasada 1 se conoce el origen y el hash del
// padre, pero no la fila en la que ese padre caera: puede estar miles de filas
// mas abajo, o no estar en el conjunto cargado
interface PendingEdge {
  readonly fromRow: Row;
  readonly fromLane: Lane;
  readonly parentHash: CommitHash;
  readonly parentIndex: number;
}

// Carriles que esperan a un mismo commit. Se guarda uno suelto cuando es el
// unico, que es el caso abrumadoramente mayoritario, y solo se asigna un array
// cuando hay convergencia real. El array es NonEmptyArray, no Lane[]: al llegar
// aqui siempre tiene ya dos carriles, y eso es lo que hace total el minOf de
// abajo, que sobre un array vacio lanzaria
type Waiters = Lane | NonEmptyArray<Lane>;

// Resultado intermedio de la pasada 1
interface LaneAssignment {
  readonly nodes: readonly CommitNode[];
  readonly pending: readonly PendingEdge[];
  readonly laneCount: number;
}

// Menor de una lista que el tipo garantiza no vacia, sin usar spread: el numero
// de carriles convergentes es pequeno, pero reduce evita cualquier limite de
// argumentos. Es generico para devolver el mismo tipo marcado que recibe: con
// `readonly number[]` habria que volver a marcar el resultado a mano
const minOf = <T extends number>(values: ReadonlyNonEmptyArray<T>): T =>
  values.reduce((lowest, value) => (value < lowest ? value : lowest));

// Convierte un DAG en posiciones. Funcion pura: los mismos commits producen
// siempre el mismo layout, que es lo que la hace testeable en aislado y lo que
// permite conservar la seleccion y el scroll entre refrescos.
export class GraphLayoutEngine {
  constructor(private readonly paletteSize: number = DEFAULT_PALETTE_SIZE) {}

  layout(graph: CommitGraph): GraphLayout {
    const { nodes, pending, laneCount } = this.assignLanes(graph);
    const edges = this.resolveEdges(nodes, pending);
    return { nodes, edges, laneCount, rowCount: nodes.length };
  }

  // --- Pasada 1: cada commit recibe su lane, cada padre queda reservado ---
  private assignLanes(graph: CommitGraph): LaneAssignment {
    // activeLanes[i] = hash que el carril i esta esperando, o null si esta libre
    const activeLanes: (CommitHash | null)[] = [];
    const waiting = new Map<CommitHash, Waiters>();
    const free = new MinHeap<Lane>();
    const nodes: CommitNode[] = [];
    const pending: PendingEdge[] = [];

    // Toma el hueco libre mas a la izquierda, o abre un lane nuevo a la derecha
    const takeFreeLane = (): Lane => {
      const reused = free.pop();
      return reused ?? Lane.of(activeLanes.push(null) - 1);
    };

    const addWaiter = (hash: CommitHash, lane: Lane): void => {
      const current = waiting.get(hash);
      if (current === undefined) {
        waiting.set(hash, lane);
      } else if (typeof current === "number") {
        waiting.set(hash, [current, lane]);
      } else {
        current.push(lane);
      }
    };

    // Reserva un lane para un padre. Si ya hay uno esperandolo, la arista
    // convergira alli y no hace falta abrir otro
    const reserveLane = (parentHash: CommitHash): void => {
      if (waiting.has(parentHash)) return;
      const target = takeFreeLane();
      activeLanes[target] = parentHash;
      addWaiter(parentHash, target);
    };

    graph.commits.forEach((commit, row) => {
      // Quien esperaba a este commit? Lookup O(1) en vez de escanear los lanes,
      // que es lo que degradaba a O(N²) en repos con muchas ramas
      const claim = waiting.get(commit.hash);
      let lane: Lane;

      if (claim === undefined) {
        // Punta de rama: nadie lo esperaba
        lane = takeFreeLane();
      } else if (typeof claim === "number") {
        lane = claim;
        activeLanes[lane] = null;
      } else {
        // Convergencia: gana el lane mas a la izquierda y los demas se liberan.
        // Las aristas entrantes ya las emitieron los hijos, no se emiten aqui
        lane = minOf(claim);
        claim.forEach((waiter) => {
          activeLanes[waiter] = null;
          if (waiter !== lane) free.push(waiter);
        });
      }
      waiting.delete(commit.hash);

      nodes.push({
        hash: commit.hash,
        row: Row.of(row),
        lane,
        colorIndex: ColorIndex.of(lane % this.paletteSize),
      });

      const [firstParent] = commit.parents;

      if (firstParent === undefined) {
        // Raiz del historial: el lane queda libre para quien venga despues
        activeLanes[lane] = null;
        free.push(lane);
      } else {
        // El primer padre HEREDA el lane, asi la rama sigue recta hacia abajo
        activeLanes[lane] = firstParent;
        addWaiter(firstParent, lane);
      }

      // Una arista por padre, incluidas las de un merge
      commit.parents.forEach((parentHash, parentIndex) => {
        if (parentIndex > 0) reserveLane(parentHash);
        pending.push({
          fromRow: Row.of(row),
          fromLane: lane,
          parentHash,
          parentIndex,
        });
      });
    });

    return { nodes, pending, laneCount: activeLanes.length };
  }

  // --- Pasada 2: cada arista pendiente aprende donde cayo su padre ---
  private resolveEdges(
    nodes: readonly CommitNode[],
    pending: readonly PendingEdge[],
  ): readonly LaneEdge[] {
    const nodeByHash = new Map(nodes.map((node) => [node.hash, node]));

    return pending.map((edge): LaneEdge => {
      const parent = nodeByHash.get(edge.parentHash);

      // El padre no esta cargado (clon shallow o limite alcanzado): la arista se
      // dibuja como cabo suelto saliendo por abajo, sin romper el resto
      if (parent === undefined) {
        return {
          fromRow: edge.fromRow,
          fromLane: edge.fromLane,
          toRow: null,
          toLane: edge.fromLane,
          colorIndex: ColorIndex.of(edge.fromLane % this.paletteSize),
          kind: "straight",
        };
      }

      // merge  - va hacia un segundo padre: sale del commit y se desplaza ya
      // branch - la rama vuelve a su base: baja recta y dobla al final
      const kind: EdgeKind =
        edge.parentIndex > 0
          ? "merge"
          : parent.lane === edge.fromLane
            ? "straight"
            : "branch";

      // La arista toma el color del lane donde recorre la mayor parte del camino
      const colorIndex =
        kind === "merge"
          ? parent.colorIndex
          : ColorIndex.of(edge.fromLane % this.paletteSize);

      return {
        fromRow: edge.fromRow,
        fromLane: edge.fromLane,
        toRow: parent.row,
        toLane: parent.lane,
        colorIndex,
        kind,
      };
    });
  }
}
