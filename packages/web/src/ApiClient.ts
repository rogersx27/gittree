import type { ApiError, CommitDetail, GraphResponse } from "@gittree/core";

// Error de la API con su codigo, para que la interfaz elija el mensaje
export class ApiRequestError extends Error {
  constructor(
    readonly code: ApiError["code"],
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

const BACKEND_DOWN =
  "No se puede contactar con el servidor de GitTree. Comprueba que esta levantado y vuelve a intentarlo.";

// Nunca se asume que la respuesta traiga JSON: si el backend esta caido, el
// proxy responde con un cuerpo vacio, y un JSON.parse a ciegas convertiria eso
// en un error interno de JavaScript en lugar de un mensaje util
const request = async <T>(url: string): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new ApiRequestError("BAD_REQUEST", BACKEND_DOWN);
  }

  const body = await response.text();

  if (body === "") {
    throw new ApiRequestError(
      "BAD_REQUEST",
      response.ok
        ? "El servidor devolvio una respuesta vacia."
        : `${BACKEND_DOWN} (HTTP ${response.status})`,
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body) as unknown;
  } catch {
    throw new ApiRequestError(
      "BAD_REQUEST",
      `El servidor devolvio una respuesta que no es JSON (HTTP ${response.status}).`,
    );
  }

  if (!response.ok) {
    const error = payload as Partial<ApiError>;
    throw new ApiRequestError(
      error.code ?? "BAD_REQUEST",
      error.message ?? "No se pudo completar la peticion.",
    );
  }

  return payload as T;
};

// Cliente HTTP de solo lectura. Dos endpoints, nada mas.
export class ApiClient {
  fetchGraph(repo: string, limit?: number): Promise<GraphResponse> {
    const params = new URLSearchParams({ repo });
    if (limit !== undefined) params.set("limit", String(limit));
    return request<GraphResponse>(`/api/graph?${params.toString()}`);
  }

  fetchDetail(repo: string, hash: string): Promise<CommitDetail> {
    const params = new URLSearchParams({ repo });
    return request<CommitDetail>(`/api/commits/${hash}?${params.toString()}`);
  }
}
