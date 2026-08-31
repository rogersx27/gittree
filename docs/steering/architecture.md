# Arquitectura

## Regla que gobierna todo

**El núcleo no conoce HTTP ni React.** `packages/core` es TypeScript puro. Es lo que permite testear el motor de layout en aislado, y lo que hace que el empaquetado futuro (Tauri, Electron) pueda reutilizarlo sin tocarlo.

Si el núcleo necesita algo del servidor para testearse, el diseño se rompió.

## Las cuatro piezas

| Pieza | Responsabilidad | No hace |
|---|---|---|
| `GitRepository` | **Única** que habla con git | No sabe de lanes, colores ni HTTP |
| `CommitGraph` | Modelo puro del DAG | No calcula posiciones |
| `GraphLayoutEngine` | Convierte el DAG en posiciones | No sabe de píxeles ni de colores hex |
| `GraphRenderer` | Pinta lo que el engine calculó | No decide ninguna posición |

Apoyo: `MinHeap` (núcleo), `RepositoryResolver` y `DetailCache` (servidor).

Corolario práctico: si el servidor necesita preguntarle algo a git, la sonda va en `GitRepository` (métodos estáticos `isRepository`, `hasCommits`), no en el servidor. Por eso `server` no depende de `simple-git`.

## Flujo

```
ruta → RepositoryResolver → GitRepository.readGraph()
     → CommitGraph.fromRawCommits() → GraphLayoutEngine.layout()
     → JSON → ApiClient → GraphRenderer
```

## El algoritmo de layout

La idea, tomada de `graph.c` de git y de la extensión Git Graph de VS Code: **un lane no pertenece a una rama, pertenece al commit padre que está esperando**.

**Pasada 1 — asignación de lanes.** Por cada commit, en orden topológico:
1. `waiting: Map<hash, lane | lane[]>` dice quién lo esperaba. Lookup O(1) — un escaneo lineal aquí degrada a O(N²).
2. Si nadie lo esperaba, es punta de rama: toma el hueco libre más a la izquierda del `MinHeap`.
3. Si lo esperaban varios (convergencia), gana el índice menor y los demás se liberan. **Aquí no se emiten aristas**: las entrantes ya las emitieron los hijos.
4. El primer padre **hereda** el lane; cada padre adicional reserva el suyo.
5. Un commit sin padres libera su lane.

**Pasada 2 — resolución de aristas.** Las aristas se emiten con el *hash* del padre porque su fila aún no se conoce. Un `map` final resuelve `toRow`/`toLane` contra el índice de nodos. Un padre ausente (clon shallow, límite alcanzado) deja `toRow: null` y se pinta como cabo suelto.

El min-heap no es un capricho de rendimiento: "el lane libre más a la izquierda" es un requisito **visual**. Una pila LIFO sería O(1) pero cambiaría posiciones y colores entre refrescos del mismo repositorio.

### Invariantes comprobables

- `aristas.length === Σ commit.parents.length`
- Ningún padre queda por encima de su hijo (`toRow > fromRow`)
- El mismo input produce el mismo layout, byte a byte
- `laneCount` coincide con las columnas que dibuja `git log --graph`

## La estrategia de render

**Las aristas se pintan todas y nunca se virtualizan.** Una rama larga atraviesa la ventana visible sin empezar ni terminar en ella; recortarla la haría desaparecer. Su número lo fija la cantidad de ramas históricas, no el de commits.

**Las filas y los nodos sí se virtualizan**, porque son proporcionales a N.

Medido: los `<path>` se mantienen constantes en cualquier posición de scroll mientras los `<circle>` y las `.row` varían con la ventana. Es la forma de verificar que esto sigue bien.

La altura de fila fija hace que localizar la primera fila visible sea `Math.floor(scrollTop / ROW_HEIGHT)` — O(1), sin búsqueda binaria sobre sumas prefijas.

### Forma de las aristas

- `straight` — hijo y padre comparten lane: vertical.
- `merge` — hacia un segundo padre: **dobla arriba**, sale del commit y se desplaza ya.
- `branch` — la rama vuelve a su base: **dobla abajo**, baja recta y gira al llegar.

Dónde dobla no es estético: marca si el lane que continúa es el del padre o el del hijo, que es lo que distingue abrir de cerrar una rama.

## Frontera cliente/servidor

Los contratos viven en `packages/core/src/`, un fichero por tipo y agrupados por entidad, y los importan los dos lados desde la subruta del paquete correspondiente (`@gittree/core/api`, `/commit`, `/layout`, `/ref`). Nunca se redeclara un tipo.

`commits[i]` y `layout.nodes[i]` describen el mismo commit: van alineados por índice, para que el cliente no tenga que hacer join por hash.

Los errores viajan siempre como `ApiError` con código, nunca como excepción sin forma. El cliente distingue *fallo de conexión* (reintentable) de *respuesta legítima del backend* (falla al instante).
