// Lane se importa como valor porque graphWidth construye uno; los otros tres
// solo se usan como tipo y no arrastran nada en tiempo de ejecucion
import { Lane, type ColorIndex, type LaneEdge, type Row } from "@gittree/core/layout";

// Constantes de la rejilla. La altura de fila es fija por diseno: es lo que hace
// que localizar la primera fila visible sea una division, O(1), sin busqueda
// binaria sobre sumas prefijas. El precio es que ninguna fila puede expandirse.
export const ROW_HEIGHT = 28;
export const LANE_WIDTH = 16;
export const NODE_RADIUS = 4.5;
export const GRAPH_PADDING = 14;

// Filas de mas que se montan fuera de la ventana, para que el scroll rapido no
// deje huecos en blanco
export const OVERSCAN_ROWS = 12;

// Ciclo de colores de lane. El engine solo emite indices: los valores viven aqui
export const LANE_COLORS: readonly string[] = [
  "#4f9cf5",
  "#f5a04f",
  "#5fc98a",
  "#e56ea8",
  "#a982f0",
  "#4fc7cf",
  "#e8c452",
  "#f0745f",
  "#7ec45f",
  "#9aa5b8",
];

// Estas tres funciones toman el tipo marcado que emite el motor, no un number
// suelto. Es lo que convierte en error de compilacion un laneX(edge.fromRow):
// las tres coordenadas son numeros y cruzarlas dibuja un grafo mal sin que nada
// falle. laneCount y rowCount siguen siendo number: son cuentas, no posiciones
export const colorOf = (index: ColorIndex): string =>
  LANE_COLORS[index % LANE_COLORS.length] ?? "#9aa5b8";

// Centro horizontal de un carril
export const laneX = (lane: Lane): number => GRAPH_PADDING + lane * LANE_WIDTH;

// Centro vertical de una fila
export const rowY = (row: Row): number => row * ROW_HEIGHT + ROW_HEIGHT / 2;

// Ancho que ocupa la columna del grafo para un numero dado de carriles. Recibe
// una cuenta, no un carril, asi que el ultimo carril hay que construirlo
export const graphWidth = (laneCount: number): number =>
  laneX(Lane.of(Math.max(laneCount - 1, 0))) + GRAPH_PADDING;

// Traza una arista. La forma depende de su tipo:
//   straight - vertical, hijo y padre comparten lane
//   merge    - sale del commit y se desplaza ya al lane destino (dobla arriba)
//   branch   - la rama baja recta y dobla al llegar a su base (dobla abajo)
// Doblar arriba o abajo no es estetico: marca si el lane que continua es el del
// padre o el del hijo, que es justo lo que distingue abrir de cerrar una rama.
export const edgePath = (edge: LaneEdge, rowCount: number): string => {
  const x1 = laneX(edge.fromLane);
  const y1 = rowY(edge.fromRow);

  // Padre fuera del conjunto cargado: cabo suelto que sale por abajo
  if (edge.toRow === null) {
    return `M ${x1} ${y1} L ${x1} ${rowCount * ROW_HEIGHT}`;
  }

  const x2 = laneX(edge.toLane);
  const y2 = rowY(edge.toRow);

  if (x1 === x2) return `M ${x1} ${y1} L ${x2} ${y2}`;

  // La curva ocupa como mucho una fila, para que el codo quede siempre limpio
  const bend = Math.min(ROW_HEIGHT, y2 - y1);

  if (edge.kind === "merge") {
    const turn = y1 + bend;
    return `M ${x1} ${y1} C ${x1} ${y1 + bend * 0.55}, ${x2} ${turn - bend * 0.55}, ${x2} ${turn} L ${x2} ${y2}`;
  }

  const turn = y2 - bend;
  return `M ${x1} ${y1} L ${x1} ${turn} C ${x1} ${turn + bend * 0.55}, ${x2} ${y2 - bend * 0.55}, ${x2} ${y2}`;
};
