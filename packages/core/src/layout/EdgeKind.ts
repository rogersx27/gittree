// Forma de una arista, que decide como se traza:
//   straight - hijo y padre comparten lane
//   branch   - el padre vive en un lane distinto (la rama se abrio aqui)
//   merge    - arista hacia un segundo padre o posterior
export type EdgeKind = "straight" | "branch" | "merge";
