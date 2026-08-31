import type { Brand, BrandFactory } from "../common";

// Indice dentro del ciclo de colores. El motor solo emite indices: los colores
// concretos viven en el renderer, que es quien sabe de pintar.
//
// Va marcado para que no pueda colarse donde se espera un carril: colorIndex
// sale de `lane % paletteSize`, asi que con pocos carriles los dos numeros
// coinciden y un cruce pasaria desapercibido justo en los casos de prueba
export type ColorIndex = Brand<number, "ColorIndex">;

export const ColorIndex: BrandFactory<number, ColorIndex> = {
  of: (value) => value as ColorIndex,
};
