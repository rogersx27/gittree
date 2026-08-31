import { CommitHash, type CommitDetail } from "@gittree/core";
import { describe, expect, it } from "vitest";
import { DetailCache } from "../src/DetailCache";

// Detalle minimo: para la cache solo importa la identidad, no el contenido
const detail = (name: string): CommitDetail => ({
  // Nombres cortos en vez de hashes reales para que el test se lea; unchecked
  // los marca sin pasar por la validacion, que no cumplirian
  hash: CommitHash.unchecked(name),
  parents: [],
  author: { name: "Test", email: "test@example.com" },
  authoredAt: "2026-01-01T00:00:00+00:00",
  committer: { name: "Test", email: "test@example.com" },
  committedAt: "2026-01-01T00:00:00+00:00",
  subject: `commit ${name}`,
  body: "",
  isMerge: false,
  files: [],
});

describe("DetailCache", () => {
  it("devuelve lo que guarda", () => {
    const cache = new DetailCache(2);
    cache.set("a", detail("a"));
    expect(cache.get("a")?.hash).toBe("a");
    expect(cache.get("noexiste")).toBeUndefined();
  });

  it("desaloja el menos usado recientemente al llenarse", () => {
    const cache = new DetailCache(2);
    cache.set("a", detail("a"));
    cache.set("b", detail("b"));
    cache.set("c", detail("c"));

    expect(cache.size).toBe(2);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")?.hash).toBe("b");
    expect(cache.get("c")?.hash).toBe("c");
  });

  it("un acierto rejuvenece la entrada y la salva del desalojo", () => {
    const cache = new DetailCache(2);
    cache.set("a", detail("a"));
    cache.set("b", detail("b"));

    // Al leer "a" pasa a ser la mas reciente, asi que la victima debe ser "b"
    cache.get("a");
    cache.set("c", detail("c"));

    expect(cache.get("a")?.hash).toBe("a");
    expect(cache.get("b")).toBeUndefined();
  });

  it("separa repositorios distintos con el mismo hash", () => {
    // Dos repos pueden compartir un hash si uno es clon del otro
    expect(DetailCache.keyOf("/repo-a", "abc")).not.toBe(
      DetailCache.keyOf("/repo-b", "abc"),
    );
  });

  it("sobrescribir una clave no duplica la entrada", () => {
    const cache = new DetailCache(2);
    cache.set("a", detail("a"));
    cache.set("a", detail("a"));
    expect(cache.size).toBe(1);
  });
});
