import type { CommitHash } from "./CommitHash";
import type { RawCommit } from "./types";

// Modelo puro del DAG: indexa los commits por hash conservando el orden en que
// llegaron. No sabe nada de lanes, colores, HTTP ni React.
export class CommitGraph {
  private constructor(
    private readonly ordered: readonly RawCommit[],
    private readonly byHash: ReadonlyMap<CommitHash, RawCommit>,
  ) {}

  // El orden topologico lo aporta git con --topo-order. Aqui solo se conserva:
  // recalcularlo solo anadiria una fuente de discrepancias con git log
  static fromRawCommits(commits: readonly RawCommit[]): CommitGraph {
    const byHash = new Map(commits.map((commit) => [commit.hash, commit]));
    return new CommitGraph(commits, byHash);
  }

  // Commits en orden topologico: define directamente las filas del grafo
  get commits(): readonly RawCommit[] {
    return this.ordered;
  }

  get size(): number {
    return this.ordered.length;
  }

  get(hash: CommitHash): RawCommit | undefined {
    return this.byHash.get(hash);
  }

  // true si ese padre no esta en el conjunto cargado, porque el clon es shallow
  // o porque se alcanzo el limite de commits
  isDangling(parentHash: CommitHash): boolean {
    return !this.byHash.has(parentHash);
  }
}
