import { describe, expect, it } from "vitest";
import { CommitHash } from "../../src/commit";

describe("CommitHash", () => {
  it("acepta un hash completo tal y como lo emite git", () => {
    const raw = "21ecb3169651718816bc2ececb86943a64ef02e8";
    expect(CommitHash.parse(raw)).toBe(raw);
    expect(CommitHash.isValid(raw)).toBe(true);
  });

  it("acepta la forma abreviada, que git resuelve igual", () => {
    expect(CommitHash.parse("21ecb31")).toBe("21ecb31");
  });

  it("acepta 64 caracteres, para repositorios en SHA-256", () => {
    expect(CommitHash.parse("a".repeat(64))).toBe("a".repeat(64));
  });

  // Este es el motivo de que el tipo exista. `git show` interpreta como OPCION
  // cualquier argumento que empiece por guion, y --output= le hace ESCRIBIR un
  // fichero: exactamente lo que GitTree promete no hacer nunca. El hash llega
  // de la URL, asi que sin esta comprobacion un GET escribe en disco
  it("rechaza un hash que en realidad es una opcion de git", () => {
    expect(CommitHash.parse("--output=/tmp/pwned.txt")).toBeNull();
    expect(CommitHash.parse("--upload-pack=calc.exe")).toBeNull();
    expect(CommitHash.parse("-c")).toBeNull();
  });

  it("rechaza cualquier cosa que no sea hexadecimal en minuscula", () => {
    // Mayusculas no: git emite %H en minuscula, y aceptarlas solo amplia la
    // superficie sin ganar nada
    expect(CommitHash.parse("21ECB31")).toBeNull();
    expect(CommitHash.parse("HEAD")).toBeNull();
    expect(CommitHash.parse("main")).toBeNull();
    expect(CommitHash.parse("../../etc/passwd")).toBeNull();
    expect(CommitHash.parse("")).toBeNull();
  });

  it("rechaza lo que es demasiado corto o demasiado largo", () => {
    expect(CommitHash.parse("abc")).toBeNull();
    expect(CommitHash.parse("a".repeat(65))).toBeNull();
  });
});
