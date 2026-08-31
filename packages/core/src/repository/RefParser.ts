import type { Ref } from "../ref";

// git emite la decoracion con --decorate=full, que antepone la ruta completa de
// cada ref. Sin ella no se puede distinguir la rama local "feature/x" de la
// remota "origin/x": ambas llevan barra y el nombre corto es ambiguo.
const HEAD_ARROW = "HEAD -> ";
const LOCAL_PREFIX = "refs/heads/";
const REMOTE_PREFIX = "refs/remotes/";
const TAG_PREFIX = "refs/tags/";

// origin/HEAD es un alias de la rama por defecto del remoto: apunta al mismo
// commit que otra ref y duplicaria la etiqueta
const isRemoteAlias = (name: string): boolean => name.endsWith("/HEAD");

// Traduce el campo %D de git log a refs tipadas.
export class RefParser {
  // Utilidad sin estado: no se instancia
  private constructor() {}

  // Convierte la decoracion completa de un commit en refs tipadas. Una cadena
  // vacia significa que ninguna ref apunta a ese commit.
  static parse(decoration: string): readonly Ref[] {
    return decoration.trim() === ""
      ? []
      : decoration
          .split(", ")
          .map(RefParser.parseEntry)
          .filter((ref): ref is Ref => ref !== null);
  }

  // Convierte una entrada de la decoracion en una ref tipada, o null si no
  // representa una posicion propia (refs/stash, alias, prefijos desconocidos)
  private static parseEntry(entry: string): Ref | null {
    // Solo la rama a la que apunta HEAD lleva el prefijo de flecha
    const isCheckedOut = entry.startsWith(HEAD_ARROW);
    const ref = isCheckedOut ? entry.slice(HEAD_ARROW.length) : entry;

    // HEAD suelto, sin flecha: el repositorio esta en estado detached
    if (ref === "HEAD") {
      return { kind: "head", name: "HEAD", isCheckedOut: false };
    }

    if (ref.startsWith(LOCAL_PREFIX)) {
      return { kind: "local", name: ref.slice(LOCAL_PREFIX.length), isCheckedOut };
    }

    if (ref.startsWith(TAG_PREFIX)) {
      return { kind: "tag", name: ref.slice(TAG_PREFIX.length), isCheckedOut: false };
    }

    if (ref.startsWith(REMOTE_PREFIX)) {
      const name = ref.slice(REMOTE_PREFIX.length);
      return isRemoteAlias(name)
        ? null
        : { kind: "remote", name, isCheckedOut: false };
    }

    return null;
  }
}
