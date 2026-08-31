import type { ApiError, GraphResponse } from "@gittree/core/api";
import type { CommitDetail, CommitHash } from "@gittree/core/commit";

// Error de la API con su codigo, para que la interfaz elija el mensaje.
// unreachable distingue "el backend no responde todavia" de "el backend
// respondio que la peticion esta mal": solo lo primero merece reintento
export class ApiRequestError extends Error {
  constructor(
    readonly code: ApiError["code"],
    message: string,
    readonly unreachable: boolean = false,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

const BACKEND_DOWN =
  "No se puede contactar con el servidor de GitTree. Comprueba que esta levantado y vuelve a intentarlo.";

// El proxy devuelve estos codigos cuando no logra hablar con el backend, que es
// justo lo que pasa durante los primeros segundos tras arrancar
const UNREACHABLE_STATUS = new Set([502, 503, 504]);

// Escalado de esperas entre reintentos: cubre unos 4,4 s en total, de sobra
// para que el backend termine de arrancar
const RETRY_DELAYS_MS: readonly number[] = [300, 500, 800, 1200, 1600];

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// Nunca se asume que la respuesta traiga JSON: si el backend esta caido, el
// proxy responde con un cuerpo vacio, y un JSON.parse a ciegas convertiria eso
// en un error interno de JavaScript en lugar de un mensaje util
const attempt = async <T>(url: string): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    // Ni siquiera hubo respuesta: el servidor de desarrollo no esta escuchando
    throw new ApiRequestError("BAD_REQUEST", BACKEND_DOWN, true);
  }

  const unreachable = UNREACHABLE_STATUS.has(response.status);
  const body = await response.text();

  if (body === "") {
    throw new ApiRequestError(
      "BAD_REQUEST",
      response.ok
        ? "El servidor devolvio una respuesta vacia."
        : `${BACKEND_DOWN} (HTTP ${response.status})`,
      unreachable,
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body) as unknown;
  } catch {
    throw new ApiRequestError(
      "BAD_REQUEST",
      `El servidor devolvio una respuesta que no es JSON (HTTP ${response.status}).`,
      unreachable,
    );
  }

  if (!response.ok) {
    const error = payload as Partial<ApiError>;
    throw new ApiRequestError(
      error.code ?? "BAD_REQUEST",
      error.message ?? "No se pudo completar la peticion.",
      unreachable,
    );
  }

  return payload as T;
};

// Encadena un reintento por cada espera, pero solo para fallos de conexion: un
// NOT_FOUND o un NOT_A_REPO son respuestas legitimas y deben fallar al instante,
// sin hacer esperar al usuario
const request = <T>(url: string): Promise<T> =>
  RETRY_DELAYS_MS.reduce<Promise<T>>(
    (chain, delay) =>
      chain.catch(async (error: unknown) => {
        if (!(error instanceof ApiRequestError) || !error.unreachable) throw error;
        await sleep(delay);
        return attempt<T>(url);
      }),
    attempt<T>(url),
  );

// Cliente HTTP de solo lectura. Dos endpoints, nada mas.
export class ApiClient {
  fetchGraph(repo: string, limit?: number): Promise<GraphResponse> {
    const params = new URLSearchParams({ repo });
    if (limit !== undefined) params.set("limit", String(limit));
    return request<GraphResponse>(`/api/graph?${params.toString()}`);
  }

  fetchDetail(repo: string, hash: CommitHash): Promise<CommitDetail> {
    const params = new URLSearchParams({ repo });
    return request<CommitDetail>(`/api/commits/${hash}?${params.toString()}`);
  }
}
