import { CommitHash, type RawCommit } from "../src/commit";

// Los fixtures usan nombres de una letra en vez de hashes reales, para que el
// DAG se lea de un vistazo. unchecked los marca sin pasar por la validacion,
// que es justo lo que estos nombres no cumplirian
export const hash = (name: string): CommitHash => CommitHash.unchecked(name);

// Construye un commit de prueba con lo minimo que necesita el layout: su hash y
// sus padres. El resto de campos no influyen en las posiciones.
export const commit = (
  name: string,
  parents: readonly string[] = [],
): RawCommit => ({
  hash: hash(name),
  parents: parents.map(hash),
  refs: [],
  author: { name: "Test", email: "test@example.com" },
  authoredAt: "2026-01-01T00:00:00+00:00",
  subject: `commit ${name}`,
});

// DAG de referencia: dos ramas y un merge, el minimo que pide el criterio de
// aceptacion. En orden topologico, con los hijos antes que sus padres.
//
//   row 0   M    merge de feature en main   parents: [B, F]
//   row 1   |\
//   row 2   B |  ultimo commit de main      parents: [A]
//   row 3   | F  punta de feature           parents: [A]
//   row 4   |/
//   row 5   A    base comun                 parents: []
//
// El primer padre de M es B (main), que es la convencion de git: en un merge,
// el primer padre es la rama sobre la que se fusiona.
export const TWO_BRANCHES_ONE_MERGE: readonly RawCommit[] = [
  commit("M", ["B", "F"]),
  commit("B", ["A"]),
  commit("F", ["A"]),
  commit("A"),
];
