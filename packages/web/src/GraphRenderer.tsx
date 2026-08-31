import type { CommitHash, GraphLayout, RawCommit } from "@gittree/core";
import { useRef } from "react";
import {
  colorOf,
  edgePath,
  graphWidth,
  laneX,
  NODE_RADIUS,
  ROW_HEIGHT,
  rowY,
} from "./geometry";
import { RefBadge } from "./RefBadge";
import { useVirtualRows } from "./useVirtualRows";

interface GraphRendererProps {
  readonly layout: GraphLayout;
  readonly commits: readonly RawCommit[];
  readonly selectedHash: string | null;
  readonly onSelect: (hash: CommitHash) => void;
}

const shortDate = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "short",
  year: "2-digit",
});

const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : shortDate.format(date);
};

// Solo pinta lo que el engine calculo: no decide ninguna posicion.
export const GraphRenderer = ({
  layout,
  commits,
  selectedHash,
  onSelect,
}: GraphRendererProps) => {
  const container = useRef<HTMLDivElement>(null);
  const { start, end } = useVirtualRows(container, layout.rowCount);

  const totalHeight = layout.rowCount * ROW_HEIGHT;
  const width = graphWidth(layout.laneCount);

  // Las aristas se pintan TODAS, nunca se virtualizan: una rama larga atraviesa
  // la ventana sin empezar ni terminar en ella, y recortarla la haria
  // desaparecer. Su numero lo fija el de ramas historicas, no el de commits.
  const edges = layout.edges;

  // Los nodos y las filas si se virtualizan: son proporcionales a N
  const visible = layout.nodes.slice(start, end);

  return (
    <div className="graph" ref={container}>
      <div className="graph-canvas" style={{ height: totalHeight }}>
        <svg
          className="graph-lines"
          width={width}
          height={totalHeight}
          aria-hidden="true"
        >
          {edges.map((edge, index) => (
            <path
              key={`${edge.fromRow}-${edge.toRow ?? "x"}-${index}`}
              d={edgePath(edge, layout.rowCount)}
              stroke={colorOf(edge.colorIndex)}
              strokeWidth={1.6}
              fill="none"
            />
          ))}
          {visible.map((node) => (
            <circle
              key={node.hash}
              cx={laneX(node.lane)}
              cy={rowY(node.row)}
              r={node.hash === selectedHash ? NODE_RADIUS + 1.5 : NODE_RADIUS}
              fill={colorOf(node.colorIndex)}
              className={node.hash === selectedHash ? "node selected" : "node"}
            />
          ))}
        </svg>

        {visible.map((node) => {
          const commit = commits[node.row];
          if (commit === undefined) return null;
          return (
            <div
              key={node.hash}
              className={`row${node.hash === selectedHash ? " row-selected" : ""}`}
              style={{ top: node.row * ROW_HEIGHT, paddingLeft: width + 8 }}
              onClick={() => onSelect(node.hash)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(node.hash);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <span className="row-refs">
                {commit.refs.map((entry) => (
                  <RefBadge key={`${entry.kind}:${entry.name}`} refEntry={entry} />
                ))}
              </span>
              <span className="row-subject">{commit.subject}</span>
              <span className="row-author">{commit.author.name}</span>
              <span className="row-date">{formatDate(commit.authoredAt)}</span>
              <span className="row-hash">{commit.hash.slice(0, 7)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
