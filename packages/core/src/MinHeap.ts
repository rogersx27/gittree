// Heap binario de enteros. Devuelve siempre el menor, que es lo que garantiza
// "el lane libre mas a la izquierda" del layout: una pila LIFO seria O(1) pero
// cambiaria posiciones y colores entre refrescos del mismo repositorio.
export class MinHeap {
  private readonly items: number[] = [];

  get size(): number {
    return this.items.length;
  }

  push(value: number): void {
    this.items.push(value);
    this.bubbleUp(this.items.length - 1);
  }

  // Extrae el minimo, o undefined si el heap esta vacio
  pop(): number | undefined {
    const { items } = this;
    const top = items[0];
    const last = items.pop();
    // Solo hay que reordenar si quedaba algo despues de sacar el ultimo
    if (last !== undefined && items.length > 0) {
      items[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  // Sube el elemento mientras sea menor que su padre
  private bubbleUp(from: number): void {
    const { items } = this;
    let index = from;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      const current = items[index];
      const above = items[parent];
      // Los dos indices existen siempre aqui; la comprobacion la exige
      // noUncheckedIndexedAccess, no la logica del heap
      if (current === undefined || above === undefined || above <= current) {
        break;
      }
      items[index] = above;
      items[parent] = current;
      index = parent;
    }
  }

  // Baja el elemento mientras alguno de sus hijos sea menor
  private sinkDown(from: number): void {
    const { items } = this;
    let index = from;
    for (;;) {
      const left = 2 * index + 1;
      const right = left + 1;
      const current = items[index];
      if (current === undefined) return;

      // Elige el menor entre el nodo y sus dos hijos
      const smallest = [left, right].reduce((best, child) => {
        const value = items[child];
        const bestValue = items[best];
        return value !== undefined && bestValue !== undefined && value < bestValue
          ? child
          : best;
      }, index);

      if (smallest === index) return;

      const swap = items[smallest];
      if (swap === undefined) return;
      items[index] = swap;
      items[smallest] = current;
      index = smallest;
    }
  }
}
