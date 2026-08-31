import { describe, expect, it } from "vitest";
import { CommitGraph } from "../src/CommitGraph";
import { GraphLayoutEngine } from "../src/GraphLayoutEngine";
import { commit, TWO_BRANCHES_ONE_MERGE } from "./fixtures";

// Atajo: construye el grafo y calcula su layout de una vez
const layoutOf = (commits: readonly ReturnType<typeof commit>[]) =>
  new GraphLayoutEngine().layout(CommitGraph.fromRawCommits(commits));

describe("GraphLayoutEngine", () => {
  describe("asignacion de lanes", () => {
    const layout = layoutOf(TWO_BRANCHES_ONE_MERGE);
    // Indice por hash para poder afirmar sobre cada commit por su nombre
    const nodeOf = (hash: string) =>
      layout.nodes.find((node) => node.hash === hash);

    it("coloca la rama principal entera en el lane 0", () => {
      // M, B y A forman la linea de first-parent: el lane se hereda y no salta
      expect(nodeOf("M")?.lane).toBe(0);
      expect(nodeOf("B")?.lane).toBe(0);
      expect(nodeOf("A")?.lane).toBe(0);
    });

    it("abre un lane nuevo para la rama fusionada", () => {
      expect(nodeOf("F")?.lane).toBe(1);
      expect(layout.laneCount).toBe(2);
    });

    it("respeta el orden topologico en las filas", () => {
      expect(layout.nodes.map((node) => node.hash)).toEqual(["M", "B", "F", "A"]);
      expect(layout.rowCount).toBe(4);
    });

    it("libera el lane de feature cuando converge en la base", () => {
      // Tras fusionarse, el lane 1 queda libre: un tercer commit posterior
      // debe reutilizarlo en vez de abrir un lane 2
      const withExtraBranch = layoutOf([
        ...TWO_BRANCHES_ONE_MERGE,
        commit("X", ["A"]),
      ]);
      expect(withExtraBranch.laneCount).toBe(2);
    });
  });

  describe("aristas", () => {
    const layout = layoutOf(TWO_BRANCHES_ONE_MERGE);
    const from = (hash: string) => {
      const row = layout.nodes.findIndex((node) => node.hash === hash);
      return layout.edges.filter((edge) => edge.fromRow === row);
    };

    it("emite exactamente una arista por padre", () => {
      // M tiene dos padres, B y F uno cada uno, A ninguno
      expect(layout.edges).toHaveLength(4);
      expect(from("M")).toHaveLength(2);
      expect(from("A")).toHaveLength(0);
    });

    it("dibuja el merge hacia el lane de la rama fusionada", () => {
      const merge = from("M").find((edge) => edge.kind === "merge");
      expect(merge).toBeDefined();
      // Sale del lane de main y entra en el de feature: dobla al principio
      expect(merge?.fromLane).toBe(0);
      expect(merge?.toLane).toBe(1);
    });

    it("mantiene recta la arista al primer padre", () => {
      const straight = from("M").find((edge) => edge.kind === "straight");
      expect(straight?.fromLane).toBe(0);
      expect(straight?.toLane).toBe(0);
    });

    it("marca como branch la vuelta de feature a la base", () => {
      // F baja por el lane 1 y dobla al llegar a A, que esta en el lane 0
      const [back] = from("F");
      expect(back?.kind).toBe("branch");
      expect(back?.fromLane).toBe(1);
      expect(back?.toLane).toBe(0);
    });
  });

  describe("robustez", () => {
    it("no lanza cuando un padre no esta en el conjunto cargado", () => {
      // Pasa con un clon shallow o cuando se alcanza el limite de commits
      const layout = layoutOf([commit("C", ["ausente"])]);
      const [dangling] = layout.edges;
      expect(dangling?.toRow).toBeNull();
      expect(dangling?.toLane).toBe(dangling?.fromLane);
    });

    it("soporta varias raices sin solaparlas", () => {
      const layout = layoutOf([commit("R1"), commit("R2")]);
      expect(layout.nodes.map((node) => node.lane)).toEqual([0, 0]);
      expect(layout.edges).toHaveLength(0);
    });
  });

  it("es determinista: la misma entrada produce el mismo layout", () => {
    // Es lo que permite conservar seleccion, scroll y colores entre refrescos
    const first = layoutOf(TWO_BRANCHES_ONE_MERGE);
    const second = layoutOf(TWO_BRANCHES_ONE_MERGE);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });
});
