import { access } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";
import type { RepoErrorCode } from "@gittree/core/api";
import { GitNotAvailableError, GitRepository } from "@gittree/core/repository";

// Error con codigo, para que la interfaz pueda dar un mensaje concreto en lugar
// de un "algo ha fallado" que no dice al usuario que arreglar
export class RepositoryError extends Error {
  constructor(
    readonly code: RepoErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

const isWindows = process.platform === "win32";

// En Windows los dos separadores son validos y se normalizan. En Linux la barra
// invertida es un caracter legitimo dentro de un nombre de archivo, asi que
// tocarla romperia rutas correctas
const normalize = (input: string): string =>
  resolvePath(isWindows ? input.trim().replace(/\\/g, "/") : input.trim());

// Traduce la ruta que escribe el usuario en un repositorio listo para leer, o en
// un error que explica exactamente que pasa con esa ruta. No habla con git
// directamente: las sondas viven en GitRepository, que es la unica pieza que lo
// hace.
export class RepositoryResolver {
  async resolve(rawPath: string): Promise<GitRepository> {
    if (rawPath.trim() === "") {
      throw new RepositoryError("NOT_FOUND", "Indica la ruta de un repositorio.");
    }

    const path = normalize(rawPath);

    try {
      await access(path);
    } catch {
      throw new RepositoryError("NOT_FOUND", `No existe esa ruta: ${path}`);
    }

    try {
      if (!(await GitRepository.isRepository(path))) {
        throw new RepositoryError(
          "NOT_A_REPO",
          `Esa carpeta no es un repositorio git: ${path}`,
        );
      }
      if (!(await GitRepository.hasCommits(path))) {
        throw new RepositoryError(
          "EMPTY_REPO",
          "Este repositorio todavia no tiene commits.",
        );
      }
    } catch (error) {
      if (error instanceof GitNotAvailableError) {
        throw new RepositoryError("GIT_MISSING", error.message);
      }
      throw error;
    }

    return new GitRepository(path);
  }
}
