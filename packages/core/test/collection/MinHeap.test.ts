import { describe, expect, it } from "vitest";
import { MinHeap } from "../../src/collection";

// Vacia el heap en orden para poder comparar la secuencia completa
const drain = (heap: MinHeap<number>): number[] => {
  const out: number[] = [];
  while (heap.size > 0) {
    const value = heap.pop();
    if (value === undefined) break;
    out.push(value);
  }
  return out;
};

const heapOf = (values: readonly number[]): MinHeap<number> => {
  const heap = new MinHeap<number>();
  values.forEach((value) => heap.push(value));
  return heap;
};

describe("MinHeap", () => {
  it("devuelve los elementos de menor a mayor", () => {
    expect(drain(heapOf([5, 1, 4, 2]))).toEqual([1, 2, 4, 5]);
  });

  it("devuelve undefined cuando esta vacio", () => {
    expect(new MinHeap<number>().pop()).toBeUndefined();
    expect(new MinHeap<number>().size).toBe(0);
  });

  it("conserva el orden intercalando inserciones y extracciones", () => {
    // Es el patron real del layout: los lanes se liberan y se reutilizan
    // mientras el recorrido avanza
    const heap = heapOf([3, 7]);
    expect(heap.pop()).toBe(3);
    heap.push(1);
    heap.push(5);
    expect(drain(heap)).toEqual([1, 5, 7]);
  });

  it("siempre entrega el lane libre mas a la izquierda", () => {
    // Un heap con muchos elementos debe seguir ordenando bien: es lo que
    // garantiza que el grafo quede compacto y determinista
    const shuffled = [9, 2, 8, 1, 7, 3, 6, 4, 5, 0];
    expect(drain(heapOf(shuffled))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});
