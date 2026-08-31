// Simbolo fantasma: no se emite, no existe en tiempo de ejecucion y ningun
// objeto lo lleva de verdad. Solo sirve para que el compilador distinga dos
// alias del mismo tipo base
declare const brand: unique symbol;

// Marca un tipo base para que deje de ser intercambiable con el.
//
// El problema que resuelve: CommitNode tiene tres numeros (row, lane,
// colorIndex) y LaneEdge cinco. Sin marca, cruzarlos compila sin una queja, y
// un grafo dibujado con la fila donde iba el carril es un fallo silencioso.
// Con marca, cada uno solo encaja donde le toca.
//
// La marca se borra al compilar: el valor sigue siendo un number o un string,
// y el JSON que viaja entre server y web es exactamente el mismo de antes.
export type Brand<TBase, TTag extends string> = TBase & {
  readonly [brand]: TTag;
};
