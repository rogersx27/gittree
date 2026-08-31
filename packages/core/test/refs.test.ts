import { describe, expect, it } from "vitest";
import { parseRefs } from "../src/refs";

describe("parseRefs", () => {
  it("devuelve lista vacia cuando ninguna ref apunta al commit", () => {
    expect(parseRefs("")).toEqual([]);
    expect(parseRefs("   ")).toEqual([]);
  });

  it("marca como checked out solo la rama a la que apunta HEAD", () => {
    // Cadena real de un repositorio con la rama activa y su remota
    const refs = parseRefs(
      "HEAD -> refs/heads/feature/ui-polish, refs/remotes/origin/feature/ui-polish",
    );
    expect(refs).toEqual([
      { kind: "local", name: "feature/ui-polish", isCheckedOut: true },
      { kind: "remote", name: "origin/feature/ui-polish", isCheckedOut: false },
    ]);
  });

  it("distingue una rama local con barra de una remota", () => {
    // Es la razon de usar --decorate=full: con el nombre corto, "feature/x" y
    // "origin/x" son indistinguibles, y ambas llevan barra
    expect(parseRefs("refs/heads/feature/api")).toEqual([
      { kind: "local", name: "feature/api", isCheckedOut: false },
    ]);
    expect(parseRefs("refs/remotes/origin/main")).toEqual([
      { kind: "remote", name: "origin/main", isCheckedOut: false },
    ]);
  });

  it("reconoce los tags", () => {
    expect(parseRefs("refs/tags/v1.0.0")).toEqual([
      { kind: "tag", name: "v1.0.0", isCheckedOut: false },
    ]);
  });

  it("etiqueta HEAD suelto como detached", () => {
    expect(parseRefs("HEAD")).toEqual([
      { kind: "head", name: "HEAD", isCheckedOut: false },
    ]);
  });

  it("descarta origin/HEAD porque es un alias", () => {
    // Apunta al mismo commit que la rama por defecto y duplicaria la etiqueta
    expect(parseRefs("refs/remotes/origin/main, refs/remotes/origin/HEAD")).toEqual([
      { kind: "remote", name: "origin/main", isCheckedOut: false },
    ]);
  });

  it("descarta el stash y cualquier prefijo desconocido", () => {
    expect(parseRefs("refs/stash")).toEqual([]);
    expect(parseRefs("refs/notes/commits")).toEqual([]);
  });
});
