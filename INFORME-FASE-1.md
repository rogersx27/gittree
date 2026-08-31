# GitTree — Informe de Fase 1 (investigación y decisiones)

Fecha: 2026-08-31 · Entorno verificado: Windows 10 + Git Bash, Node v25.3.0, pnpm 11.10.0, git 2.43.0.windows.1

> Las mediciones de este informe se hicieron sobre **`repo-ref`**, un repositorio real de 112 commits, 14 merges y 38 refs; `repo-b` y `repo-c` son otros dos repositorios reales de 32 commits usados solo para contrastar la equivalencia del algoritmo.

## 1. Lectura del repo → **CLI de git vía `simple-git`**

| Criterio | `simple-git` | `isomorphic-git` | `nodegit` |
|---|---|---|---|
| Última release | **3.36.0 (2026-04-12)** | 1.41.9 (2026-08-23) | **0.27.0 (2020-07-28)**; `next` = `0.28.0-alpha.38` |
| Instalación | JS puro, 5 deps, sin compilar | JS puro | **binding nativo libgit2** + `node-gyp` / `node-pre-gyp` |
| Cross-platform | Delega en el `git` del sistema | Total (no necesita git) | Frágil: depende de prebuilds por versión de Node/ABI |
| Velocidad (commits + padres + refs) | La de `git log` en C | Parsea packfiles en JS → la más lenta | La de libgit2 |

**Decisión: `simple-git`.** `nodegit` queda descartado: lleva **6 años sin release estable** y solo publica alphas; obliga a compilar contra libgit2 o a depender de prebuilds — inaceptable para "debe funcionar en Windows y en un VPS Ubuntu". `isomorphic-git` está vivo y bien mantenido, pero su valor diferencial (funcionar *sin* binario de git, en el navegador) no aplica a nuestro caso: un repo local en una máquina de desarrollo, donde git ya existe; a cambio pagaríamos el parseo de packfiles en JS.

Matiz honesto: la API tipada de `simple-git` (`.log()`) no expone bien `%P` (padres) ni `%D` (refs), así que la lectura real va por `.raw()` con un formato propio. Es decir, `simple-git` aporta sobre todo *spawn seguro, cola de comandos y normalización de errores*; el formato lo controlamos nosotros. Como todo queda detrás de `GitRepository`, cambiar de motor después es sustituir una clase.

**Comando único, validado en tu máquina** (`repo-ref`): registros separados por `NUL` (`-z`) y campos por `US` (`\x1f`), bytes que no pueden aparecer dentro de un mensaje de commit:

```
git log --branches --tags --remotes HEAD --topo-order -z --pretty=format:%H%x1f%P%x1f%D%x1f%an%x1f%ae%x1f%aI%x1f%s
```

Medición real: **112 commits parseados en 68 ms**, 1 raíz, 14 merges y 24 commits con refs (incluye `HEAD -> rama`, `origin/*`, tags). Un solo proceso devuelve commits + padres + refs; no hacen falta llamadas extra.

La medición se tomó con `--all`. El comando definitivo usa `--branches --tags --remotes HEAD` porque `--all` arrastra también `refs/stash`, que aporta 2 commits ajenos al historial (110 en lugar de 112).

## 2. Algoritmo de layout del DAG → **asignación de carriles por reserva de padres**

Referencias revisadas: `graph.c` de git (arrays `columns` / `new_columns`, `graph_update_columns`, `graph_insert_into_new_columns`, colapso de columnas) y `web/graph.ts` de la extensión **Git Graph** de VS Code (`Vertex` / `Branch`, `determinePath`, `getAvailableColour`, y el flag `lockedFirst` que decide dónde dobla la arista). Ambos convergen en la misma idea: **un carril no pertenece a una rama, pertenece al commit padre que ese carril está esperando**.

`@gitgraph/js` se descarta como motor: está congelado (1.4.0, 2021) y está pensado para *dibujar grafos inventados* (docs, demos), no para posicionar el DAG de un repo real.

Nuestro algoritmo es esa idea reducida a una sola pasada. Esta es ya la versión
indexada (ver el análisis de coste más abajo: la versión con `indexOf` es O(N²)
en el peor caso):

```
// Entrada: commits en orden topologico (todo hijo aparece antes que sus padres)
// Estado:
//   activeLanes[i] = hash que el carril i esta esperando, o null
//   waiting        = Map<hash, carril | carriles[]>  (indice invertido, O(1))
//   free           = min-heap de carriles libres (preserva "el mas a la izquierda")
function layout(commits):
  activeLanes, nodes, edges = [], [], []
  waiting = new Map()
  free = new MinHeap()

  // Toma el hueco libre mas a la izquierda, o abre un carril nuevo a la derecha
  takeFreeLane() =
    free.size ? free.pop() : activeLanes.push(null) - 1

  for (row, commit) of commits.entries():

    // 1. Quien esperaba a este commit? Lookup O(1) en vez de escanear carriles
    claim = waiting.get(commit.hash)

    if claim == NONE:
      // Punta de rama: nadie lo esperaba
      lane = takeFreeLane()
    else if claim is number:
      lane = claim
      activeLanes[lane] = null
    else:
      // 2. Convergencia: gana el carril mas a la izquierda, el resto se libera
      //    y emite su arista de entrada (es el lado derecho de un merge)
      lane = min(claim)
      for i of claim:
        activeLanes[i] = null
        if i != lane:
          edges.push({ from: openEdgeOf(i), to: (row, lane), color: colorOf(i) })
          free.push(i)
    waiting.delete(commit.hash)
    nodes.push({ hash: commit.hash, row, lane, color: colorOf(lane) })

    // 3. Reserva de padres: el primer padre HEREDA el carril (la rama sigue
    //    recta); cada padre adicional (merge) reserva su propio carril
    [first, ...rest] = commit.parents
    if first == NONE:
      // Raiz: el carril queda libre
      free.push(lane)
    else:
      activeLanes[lane] = first
      addWaiter(waiting, first, lane)

    for p of rest:
      // Si ya hay un carril esperando a ese padre, la arista converge alli
      existing = waiting.get(p)
      target = existing != NONE
        ? minOf(existing)
        : (t = takeFreeLane(); activeLanes[t] = p; addWaiter(waiting, p, t); t)
      edges.push({ from: (row, lane), to: openEnd(target), color: colorOf(target) })

  return { nodes, edges, laneCount: activeLanes.length }
```

Trazado de aristas: si `lane(hijo) == lane(padre)` es un segmento recto; si difieren, la arista **se mantiene en el carril del hijo hasta la fila del padre y dobla al final** (equivalente al `lockedFirst` de Git Graph). Así los merges entran limpios sin cruzar carriles activos. Color estable por índice de carril y reciclado al liberarse, igual que `getAvailableColour()`.

**Coste (corregido tras la evaluación con `algo-research`)**: el pseudocódigo de arriba usa escaneos lineales (`indexOf`) sobre el arreglo de carriles, lo que da **O(N · L)** — y como `L` no está acotado, el peor caso real es **O(N²)**: N puntas de rama colgando de una base común, que es justo lo que produce `--all` en un repo con muchas ramas remotas viejas. Medido: 50.000 puntas = **6.076 ms** con el hilo bloqueado.

**Corrección adoptada**: sustituir los tres escaneos por un índice invertido `Map<hash, carril | carriles[]>` (O(1) promedio) más un **min-heap** de huecos libres (O(log L), necesario para conservar la semántica visual de "el carril libre más a la izquierda"; una pila LIFO sería O(1) pero cambiaría posiciones y colores entre refrescos). El mismo peor caso baja a **7 ms** (870×).

Contrapartida medida: por debajo de **L ≈ 16** el escaneo lineal es hasta 1,4× más rápido, porque recorrer un arreglo de 5 elementos cuesta nanosegundos y el Map paga hashing y asignación. Se acepta ese +30% en el caso común (2,0 → 2,9 ms, invisible) a cambio de eliminar el cliff de 6 segundos. Se descarta una versión adaptativa: dos rutas de código que pueden divergir para ahorrar 1 ms.

La sustitución es segura: se verificó **equivalencia exacta de nodos y aristas** entre ambas variantes sobre `repo-ref` (N=112, L=5), `repo-b` y `repo-c`.

El orden topológico no se implementa: lo aporta `--topo-order`, resuelto en C por git. Y al ser una función pura `CommitGraph → Layout`, es testeable en aislado tal y como pide el criterio de aceptación.

## 3. Render → **SVG con virtualización de filas**

El umbral conocido de SVG está en **~3.000–5.000 elementos** en el DOM antes de degradarse (canvas dibuja 1.000 objetos en ~1 ms frente a ~10 ms de SVG). Ese techo solo se toca si pintamos *todo* el repo a la vez.

**Corrección importante tras la evaluación**: virtualizar *también las aristas* es un bug, no una optimización. Una arista de rama larga **atraviesa** la ventana visible sin empezar ni terminar en ella, así que al pintar solo el rango `[inicio, fin]` simplemente desaparece. Medido con ventana de 80 filas: **8 aristas atravesando en `repo-ref`** (un repo de 112 commits) y 126 en un sintético de 50k.

La solución no es un interval tree, sino **no virtualizar las aristas**: su número lo fija la cantidad de ramas históricas, no `N`.

| repo | commits | tramos de arista | elementos SVG (ventana 80) |
|---|---|---|---|
| repo-ref | 112 | 34 | ~514 |
| sintético | 50.249 | 249 | ~729 |

Un `<path>` por tramo más ~6 elementos por fila visible da **~500–730 elementos**, muy por debajo del umbral. Es lo que hace Git Graph en `Branch.draw()`, consolidando líneas rectas consecutivas en un solo path.

**Estrategia final: aristas completas sin virtualizar (O(tramos)) + filas virtualizadas (O(k))**, lo que además elimina el código de clipping. La virtualización de filas es el patrón *sliding window*: cada fila entra y sale una vez, O(k) por frame. Con **altura de fila fija**, localizar la primera fila visible es `floor(scrollTop / ROW_H)` — **O(1)**, sin búsqueda binaria sobre sumas prefijas (a cambio de renunciar a filas expandibles dentro del grafo).

**Decisión: SVG.** Gana en lo que un *viewer* necesita: hit-testing gratis para seleccionar un commit, hover y estilos por CSS, texto de refs seleccionable, accesibilidad, y cero código de picking manual. Canvas solo haría falta para pintar decenas de miles de commits *sin* virtualizar. Si algún día ocurre, `GraphRenderer` es reemplazable por contrato.

## 4. Arquitectura de ejecución → **backend Node fino + React (Vite) en el navegador**

Descartamos Tauri y Electron **para el MVP**, por una razón concreta de tus entornos objetivo: un **VPS Ubuntu no tiene escritorio**, así que una app nativa no correría ahí; una web local sí (`ssh -L` o el puerto). Además Tauri exige toolchain de Rust y depende del WebView de cada SO (WebView2 en Windows, WebKit en Linux), y Electron arrastra ~150 MB de Chromium. Ambos son coste de *empaquetado*, que el prompt manda dejar para una fase posterior.

- **Backend**: Fastify con dos endpoints de solo lectura — `GET /api/graph?repo=<ruta>` y `GET /api/commit/:hash?repo=<ruta>` (detalle + `--name-status`). Aloja `GitRepository`, `CommitGraph` y `GraphLayoutEngine`.
- **Frontend**: React + TypeScript estricto con Vite; `GraphRenderer` en SVG. Proxy de Vite al backend en desarrollo.
- **Cacheo**: el detalle de commit es inmutable por hash → LRU acotada en el backend (O(1) en get/put, memoria fija). El layout se memoiza por `HEAD` + lista de refs, para que un refresco sin cambios no recalcule nada.
- Un solo `pnpm dev` levanta ambos, idéntico en Windows y en Linux. El empaquetado posterior (Tauri sidecar o Electron) reutiliza el núcleo sin tocarlo, porque nada del núcleo depende del transporte HTTP.

**Seguridad**: el endpoint recibe una ruta de repo. Se valida que exista y que sea un repo git (`git rev-parse --git-dir`), y los argumentos van por `execFile` en array, **sin shell** — nunca interpolación de strings.

## Repo de prueba para los criterios de aceptación

`repo-ref` — 112 commits, **14 merges**, 38 refs. Cumple de sobra el mínimo de "2 ramas y 1 merge". Cualquier repositorio con al menos dos ramas y un merge sirve para reproducir las verificaciones; los números concretos de este informe corresponden a ese repositorio.

## Fuentes

- npm registry, consultado 2026-08-31: metadatos y fechas de `simple-git`, `isomorphic-git`, `nodegit`, `@gitgraph/js`
- [mhutchie/vscode-git-graph — `web/graph.ts`](https://github.com/mhutchie/vscode-git-graph)
- [git/git — `graph.c`](https://github.com/git/git)
- [npm-compare: isomorphic-git / nodegit / simple-git](https://npm-compare.com/isomorphic-git,nodegit,simple-git)
- [isomorphic-git FAQ](https://isomorphic-git.org/docs/en/faq)
- [ApexCharts — SVG vs Canvas (2026)](https://apexcharts.com/blog/svg-vs-canvas-charts/) · [JointJS — SVG versus Canvas](https://www.jointjs.com/blog/svg-versus-canvas)
- [Tauri vs Electron: trade-offs reales](https://www.gethopp.app/blog/tauri-vs-electron)
