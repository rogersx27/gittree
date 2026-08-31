import type { Brand, BrandFactory } from "../common";

// Carril del grafo: la posicion horizontal de un commit, contando desde 0 por
// la izquierda. Un carril no pertenece a una rama, pertenece al commit padre
// que ese carril esta esperando
export type Lane = Brand<number, "Lane">;

export const Lane: BrandFactory<number, Lane> = {
  of: (value) => value as Lane,
};
