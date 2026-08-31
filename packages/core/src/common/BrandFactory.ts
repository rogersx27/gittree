// La fabrica de un tipo marcado: lo unico que sabe convertir el tipo base en el
// marcado. Existe por dos motivos.
//
// El primero es que concentra en un solo punto la conversion. Marcar un tipo
// obliga a que en algun sitio se afirme "este number ES un carril", y esa
// afirmacion el compilador no puede comprobarla: lo util es que ocurra una vez
// y con nombre, en vez de repartida por el codigo.
//
// El segundo es que isolatedDeclarations no puede inferir el tipo de un objeto
// literal exportado. Anotandolo con este generico, cada fabrica declara su tipo
// sin repetir la forma tres veces.
export interface BrandFactory<TBase, TBranded extends TBase> {
  readonly of: (value: TBase) => TBranded;
}
