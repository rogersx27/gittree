import type { ApiError, CommitDetail, GraphResponse } from "@gittree/core";

// Error de la API con su codigo, para que la interfaz elija el mensaje
export class ApiRequestError extends Error {
  constructor(readonly code: ApiError["code"], message: string) {
    super(message);
    this.name = "ApiRequestError";
  }
}

const request = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  const payload: unknown = await response.json();

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
    return request<CommitDetail>(
      `/api/commits/${hash}?${params.toString()}`,
    );
  }
}
