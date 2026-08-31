import type { CommitDetail } from "@gittree/core";

// El detalle de un commit es inmutable: una vez leido, cachearlo es seguro.
//
// No hace falta lista doblemente enlazada. Map conserva el orden de insercion,
// asi que borrar y reinsertar en cada acierto deja siempre al menos usado
// recientemente en la primera posicion del iterador. O(1) amortizado.
export class DetailCache {
  private readonly entries = new Map<string, CommitDetail>();

  constructor(private readonly capacity: number = 200) {}

  get size(): number {
    return this.entries.size;
  }

  // La clave lleva la ruta del repositorio: dos repos pueden compartir hash
  static keyOf(repoPath: string, hash: string): string {
    return `${repoPath}:${hash}`;
  }

  get(key: string): CommitDetail | undefined {
    const hit = this.entries.get(key);
    if (hit === undefined) return undefined;

    // Reinsertar lo mueve al final, marcandolo como el mas reciente
    this.entries.delete(key);
    this.entries.set(key, hit);
    return hit;
  }

  set(key: string, value: CommitDetail): void {
    this.entries.delete(key);
    this.entries.set(key, value);

    if (this.entries.size > this.capacity) {
      // El primero del iterador es el menos usado recientemente
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
  }
}
