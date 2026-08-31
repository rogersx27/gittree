// La version de solo lectura de NonEmptyArray, para quien consume sin mutar.
// Un NonEmptyArray es asignable a este, no al reves
export type ReadonlyNonEmptyArray<T> = readonly [T, ...T[]];
