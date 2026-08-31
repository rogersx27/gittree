import { useState, type FormEvent } from "react";

interface RepoPickerProps {
  readonly initialPath: string;
  readonly loading: boolean;
  readonly canRefresh: boolean;
  readonly onOpen: (path: string) => void;
  readonly onRefresh: () => void;
}

export const RepoPicker = ({
  initialPath,
  loading,
  canRefresh,
  onOpen,
  onRefresh,
}: RepoPickerProps) => {
  const [path, setPath] = useState(initialPath);

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    onOpen(path);
  };

  return (
    <form className="picker" onSubmit={submit}>
      <span className="brand">GitTree</span>
      <input
        className="picker-input"
        value={path}
        onChange={(event) => setPath(event.target.value)}
        placeholder="Ruta del repositorio, por ejemplo C:\proyectos\mi-repo"
        spellCheck={false}
        aria-label="Ruta del repositorio"
      />
      <button type="submit" disabled={loading}>
        {loading ? "Abriendo…" : "Abrir"}
      </button>
      {/* El refresco es siempre manual: nunca se recarga solo */}
      <button
        type="button"
        onClick={onRefresh}
        disabled={!canRefresh || loading}
        title="Volver a leer el repositorio"
      >
        Refrescar
      </button>
    </form>
  );
};
