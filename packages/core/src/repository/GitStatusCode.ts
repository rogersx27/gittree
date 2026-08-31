// Los codigos que emite git en --name-status. Es una union cerrada, no un
// string cualquiera: asi la tabla que los traduce tiene que cubrirlos todos, y
// anadir uno nuevo aqui rompe la compilacion hasta que se le da traduccion
export type GitStatusCode = "A" | "M" | "D" | "R" | "C" | "T";
