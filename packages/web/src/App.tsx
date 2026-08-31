import type { CommitDetail, GraphResponse } from "@gittree/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiClient, ApiRequestError } from "./ApiClient";
import { CommitDetailPanel } from "./CommitDetailPanel";
import { GraphRenderer } from "./GraphRenderer";
import { RepoPicker } from "./RepoPicker";

const api = new ApiClient();

// Se recuerda la ultima ruta abierta para no reescribirla en cada arranque
const LAST_REPO_KEY = "gittree:last-repo";

const readLastRepo = (): string => {
  try {
    return window.localStorage.getItem(LAST_REPO_KEY) ?? "";
  } catch {
    return "";
  }
};

const messageOf = (error: unknown): string =>
  error instanceof ApiRequestError || error instanceof Error
    ? error.message
    : "Error inesperado.";

export const App = () => {
  const [repoPath, setRepoPath] = useState("");
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [detail, setDetail] = useState<CommitDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Evita que una respuesta lenta pise a otra mas reciente
  const requestId = useRef(0);

  const load = useCallback(async (path: string): Promise<void> => {
    const id = ++requestId.current;
    setLoading(true);
    setGraphError(null);
    try {
      const response = await api.fetchGraph(path);
      if (id !== requestId.current) return;

      setGraph(response);
      setRepoPath(response.repoPath);
      try {
        window.localStorage.setItem(LAST_REPO_KEY, response.repoPath);
      } catch {
        // Sin almacenamiento disponible se sigue igual: es solo una comodidad
      }

      // Si el commit seleccionado ya no existe tras refrescar, se limpia
      setSelectedHash((current) =>
        current !== null &&
        response.commits.some((commit) => commit.hash === current)
          ? current
          : null,
      );
    } catch (error) {
      if (id !== requestId.current) return;
      // Un fallo no descarta el grafo que ya estaba en pantalla
      setGraphError(messageOf(error));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // Al arrancar se reabre el ultimo repositorio, si lo hubo
  useEffect(() => {
    const last = readLastRepo();
    if (last !== "") void load(last);
  }, [load]);

  useEffect(() => {
    if (selectedHash === null || repoPath === "") {
      setDetail(null);
      setDetailError(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);

    api
      .fetchDetail(repoPath, selectedHash)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .catch((error: unknown) => {
        if (!cancelled) setDetailError(messageOf(error));
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedHash, repoPath]);

  return (
    <div className="app">
      <RepoPicker
        initialPath={readLastRepo()}
        loading={loading}
        canRefresh={graph !== null}
        onOpen={(path) => void load(path)}
        onRefresh={() => void load(repoPath)}
      />

      {graphError !== null ? <p className="banner error">{graphError}</p> : null}

      {graph === null ? (
        <main className="empty">
          <p className="hint">
            {loading
              ? "Leyendo el repositorio…"
              : "Indica la ruta de un repositorio local para ver su árbol."}
          </p>
        </main>
      ) : (
        <main className="workspace">
          <GraphRenderer
            layout={graph.layout}
            commits={graph.commits}
            selectedHash={selectedHash}
            onSelect={setSelectedHash}
          />
          <CommitDetailPanel
            detail={detail}
            loading={detailLoading}
            error={detailError}
          />
        </main>
      )}

      {graph === null ? null : (
        <footer className="statusbar">
          <span className="mono">{graph.repoPath}</span>
          <span>
            {graph.layout.rowCount} commits · {graph.layout.laneCount} lanes
            {graph.truncated ? " · historial truncado" : ""}
          </span>
        </footer>
      )}
    </div>
  );
};
