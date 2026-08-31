import { describe, expect, it } from "vitest";
import { CommitGraph } from "../src/CommitGraph";
import { commit, TWO_BRANCHES_ONE_MERGE } from "./fixtures";

describe("CommitGraph", () => {
  const graph = CommitGraph.fromRawCommits(TWO_BRANCHES_ONE_MERGE);

  it("conserva el orden topologico que aporta git", () => {
    // No lo recalcula: reimplementar el orden solo anadiria discrepancias
    expect(graph.commits.map((entry) => entry.hash)).toEqual(["M", "B", "F", "A"]);
    expect(graph.size).toBe(4);
  });

  it("indexa los commits por hash", () => {
    expect(graph.get("F")?.parents).toEqual(["A"]);
    expect(graph.get("noexiste")).toBeUndefined();
  });

  it("detecta un padre que no esta en el conjunto cargado", () => {
    expect(graph.isDangling("A")).toBe(false);
    expect(graph.isDangling("ausente")).toBe(true);
  });

  it("acepta un historial vacio", () => {
    const empty = CommitGraph.fromRawCommits([]);
    expect(empty.size).toBe(0);
    expect(empty.commits).toEqual([]);
  });

  it("no pierde commits que compartan asunto", () => {
    const graph = CommitGraph.fromRawCommits([commit("a1"), commit("a2")]);
    expect(graph.size).toBe(2);
  });
});
