import {
  CommitGraph,
  GraphLayoutEngine,
  type ApiError,
  type GraphResponse,
} from "@gittree/core";
import type { FastifyInstance } from "fastify";
import { DetailCache } from "./DetailCache";
import { RepositoryError, RepositoryResolver } from "./RepositoryResolver";

// Techo del historial que se envia en una respuesta. El grafo entero viaja junto
// porque paginarlo no sirve: una pagina no basta para dibujar las aristas que la
// atraviesan
const DEFAULT_LIMIT = 10_000;
const MAX_LIMIT = 50_000;

// Cada codigo de error se traduce al estado HTTP que le corresponde
const STATUS_BY_CODE: Readonly<Record<ApiError["code"], number>> = {
  NOT_FOUND: 404,
  NOT_A_REPO: 400,
  EMPTY_REPO: 404,
  GIT_MISSING: 500,
  BAD_REQUEST: 400,
  COMMIT_NOT_FOUND: 404,
};

interface RepoQuery {
  readonly repo?: string;
  readonly limit?: string;
}

// Acota el limite pedido al rango permitido, ignorando valores no numericos
const clampLimit = (raw: string | undefined): number => {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.min(Math.floor(parsed), MAX_LIMIT)
    : DEFAULT_LIMIT;
};

export const registerRoutes = (app: FastifyInstance): void => {
  const resolver = new RepositoryResolver();
  const engine = new GraphLayoutEngine();
  const cache = new DetailCache();

  // Traduce cualquier fallo en una respuesta con forma de ApiError, para que la
  // interfaz nunca reciba una excepcion sin estructura
  const fail = (error: unknown): { status: number; body: ApiError } => {
    if (error instanceof RepositoryError) {
      return {
        status: STATUS_BY_CODE[error.code],
        body: { code: error.code, message: error.message },
      };
    }
    const message = error instanceof Error ? error.message : "Error inesperado";
    return { status: 500, body: { code: "BAD_REQUEST", message } };
  };

  app.get<{ Querystring: RepoQuery }>("/api/graph", async (request, reply) => {
    const { repo, limit } = request.query;
    if (repo === undefined || repo.trim() === "") {
      return reply
        .status(400)
        .send({ code: "BAD_REQUEST", message: "Falta el parametro repo." });
    }

    try {
      const repository = await resolver.resolve(repo);
      const maxCount = clampLimit(limit);
      const commits = await repository.readGraph(maxCount);
      const layout = engine.layout(CommitGraph.fromRawCommits(commits));

      const response: GraphResponse = {
        repoPath: repository.path,
        commits,
        layout,
        // Si se devolvieron tantos commits como el limite, es probable que el
        // historial siga mas abajo
        truncated: commits.length >= maxCount,
      };
      return reply.send(response);
    } catch (error) {
      const { status, body } = fail(error);
      return reply.status(status).send(body);
    }
  });

  app.get<{ Params: { hash: string }; Querystring: RepoQuery }>(
    "/api/commits/:hash",
    async (request, reply) => {
      const { repo } = request.query;
      const { hash } = request.params;
      if (repo === undefined || repo.trim() === "") {
        return reply
          .status(400)
          .send({ code: "BAD_REQUEST", message: "Falta el parametro repo." });
      }

      try {
        const repository = await resolver.resolve(repo);
        const key = DetailCache.keyOf(repository.path, hash);

        const cached = cache.get(key);
        if (cached !== undefined) return reply.send(cached);

        const detail = await repository.readCommitDetail(hash);
        cache.set(key, detail);
        return reply.send(detail);
      } catch (error) {
        const { status, body } = fail(error);
        return reply.status(status).send(body);
      }
    },
  );
};
