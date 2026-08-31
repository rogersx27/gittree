// Simbolo fantasma: no se emite, no existe en tiempo de ejecucion y ningun
// objeto lo lleva de verdad. Solo sirve para que el compilador distinga dos
// alias del mismo tipo base
declare const brand: unique symbol;

// Marca un tipo base para que deje de ser intercambiable con el.
//
// La marca se borra al compilar: el valor sigue siendo un string o un number, y
// el JSON que viaja entre server y web es exactamente el mismo de antes. Lo
// unico que cambia es que el compilador ya no acepta cualquier string donde se
// espera uno que ha pasado por una comprobacion.
export type Brand<TBase, TTag extends string> = TBase & {
  readonly [brand]: TTag;
};
