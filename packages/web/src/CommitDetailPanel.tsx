import type { ChangedFile, CommitDetail } from "@gittree/core/commit";

// Etiqueta corta por tipo de cambio, la misma letra que usa git
const STATUS_LABEL: Readonly<Record<ChangedFile["status"], string>> = {
  added: "A",
  modified: "M",
  deleted: "D",
  renamed: "R",
  copied: "C",
  typeChanged: "T",
};

interface CommitDetailPanelProps {
  readonly detail: CommitDetail | null;
  readonly loading: boolean;
  readonly error: string | null;
}

const fullDate = new Intl.DateTimeFormat("es", {
  dateStyle: "long",
  timeStyle: "short",
});

const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : fullDate.format(date);
};

export const CommitDetailPanel = ({
  detail,
  loading,
  error,
}: CommitDetailPanelProps) => {
  if (loading) return <aside className="detail"><p className="hint">Cargando detalle…</p></aside>;
  if (error !== null) return <aside className="detail"><p className="error">{error}</p></aside>;
  if (detail === null) {
    return (
      <aside className="detail">
        <p className="hint">Selecciona un commit para ver su detalle.</p>
      </aside>
    );
  }

  return (
    <aside className="detail">
      <h2 className="detail-subject">{detail.subject}</h2>

      <dl className="detail-meta">
        <dt>Hash</dt>
        <dd className="mono">{detail.hash}</dd>
        <dt>Autor</dt>
        <dd>
          {detail.author.name} <span className="muted">{detail.author.email}</span>
        </dd>
        <dt>Fecha</dt>
        <dd>{formatDate(detail.authoredAt)}</dd>
        {detail.isMerge ? (
          <>
            <dt>Merge</dt>
            <dd className="mono">
              {detail.parents.map((parent) => parent.slice(0, 7)).join(" + ")}
            </dd>
          </>
        ) : null}
      </dl>

      {detail.body === "" ? null : <pre className="detail-body">{detail.body}</pre>}

      <h3 className="detail-files-title">
        {detail.files.length} archivo{detail.files.length === 1 ? "" : "s"}
        {/* Un merge muestra lo que aporto respecto a su primer padre */}
        {detail.isMerge ? <span className="muted"> · frente al primer padre</span> : null}
      </h3>

      <ul className="detail-files">
        {detail.files.map((file) => (
          <li key={`${file.status}:${file.path}`}>
            <span className={`status status-${file.status}`}>
              {STATUS_LABEL[file.status]}
            </span>
            <span className="file-path">
              {file.previousPath === undefined ? (
                file.path
              ) : (
                <>
                  <span className="muted">{file.previousPath}</span> → {file.path}
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
};
