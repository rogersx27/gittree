import type { Brand, BrandFactory } from "../common";

// Fila del grafo: la posicion vertical de un commit, contando desde 0 arriba.
// Coincide con su indice en el orden topologico que devuelve git.
//
// Va marcada porque LaneEdge lleva cinco numeros (fromRow, fromLane, toRow,
// toLane, colorIndex) y sin marca nada impide construir una arista con la fila
// donde iba el carril: compila, se dibuja, y sale un grafo mal
export type Row = Brand<number, "Row">;

export const Row: BrandFactory<number, Row> = {
  of: (value) => value as Row,
};
