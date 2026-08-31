import { useEffect, useState, type RefObject } from "react";
import { OVERSCAN_ROWS, ROW_HEIGHT } from "./geometry";

export interface VisibleRange {
  readonly start: number;
  readonly end: number;
}

// Ventana deslizante sobre las filas: solo se montan las visibles mas un margen.
// Con altura de fila fija el indice sale de una division, sin busqueda binaria.
export const useVirtualRows = (
  container: RefObject<HTMLElement | null>,
  rowCount: number,
): VisibleRange => {
  const [range, setRange] = useState<VisibleRange>({ start: 0, end: 0 });

  useEffect(() => {
    const element = container.current;
    if (element === null) return;

    const recompute = (): void => {
      const first = Math.floor(element.scrollTop / ROW_HEIGHT);
      const visible = Math.ceil(element.clientHeight / ROW_HEIGHT);
      setRange({
        start: Math.max(0, first - OVERSCAN_ROWS),
        end: Math.min(rowCount, first + visible + OVERSCAN_ROWS),
      });
    };

    recompute();
    element.addEventListener("scroll", recompute, { passive: true });

    // El alto del contenedor cambia al redimensionar la ventana o el panel
    const observer = new ResizeObserver(recompute);
    observer.observe(element);

    return () => {
      element.removeEventListener("scroll", recompute);
      observer.disconnect();
    };
  }, [container, rowCount]);

  return range;
};
