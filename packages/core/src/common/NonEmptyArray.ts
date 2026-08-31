// Array del que el compilador sabe que tiene al menos un elemento.
//
// Lo que hace seguro: un `reduce` sin valor inicial lanza en tiempo de
// ejecucion sobre un array vacio, y el tipo `T[]` no avisa. Sobre este tipo, el
// compilador garantiza que ese caso no existe.
export type NonEmptyArray<T> = [T, ...T[]];
