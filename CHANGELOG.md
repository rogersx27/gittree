# Changelog

Todos los cambios notables de este proyecto se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y el versionado sigue [Semantic Versioning](https://semver.org/lang/es/).

## [Sin publicar]

### Añadido

- Workspace pnpm con tres paquetes: `@gittree/core`, `@gittree/server` y `@gittree/web` (tarea 0.1).
- Configuración de TypeScript estricta compartida, con `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` y `verbatimModuleSyntax`.
- Integración continua en GitHub Actions sobre Ubuntu y Windows, con Node 22 y 24.
- Informe de investigación técnica con las decisiones de arquitectura medidas (`INFORME-FASE-1.md`).
- Especificación completa del MVP en `specs/gittree-mvp/`: requirements en formato EARS, design y 21 tareas ordenadas por dependencia.

- Núcleo completo: `GitRepository`, `CommitGraph`, `GraphLayoutEngine` y `MinHeap`, con 32 tests.
- Backend Fastify de solo lectura con dos endpoints, errores tipados y caché LRU del detalle.
- Interfaz React: grafo en SVG con lanes de color, etiquetas de refs, detalle del commit y refresco manual. Tema claro y oscuro.

### Corregido durante la implementación

- El parseo de refs necesita `--decorate=full`: sin él, la rama local `feature/api` y la remota `origin/api` son indistinguibles.
- Los archivos de un merge requieren `--first-parent -m`; sin esos flags git suprime el diff y la lista sale vacía.
- El historial se lee con `--branches --tags --remotes HEAD` en lugar de `--all`, que arrastra `refs/stash`.
- El asunto del commit se colapsaba a cero ancho al estrechar la ventana; se invirtió el orden en que las columnas ceden espacio.

### Seguridad

- **El hash de un commit ya no llega sin validar a `git show`.** `git show` interpreta como *opción* cualquier argumento que empiece por guion, y `--output=fichero` le hace escribir en disco. Como el hash viajaba de la URL al comando, un `GET /api/commits/--output=...` bastaba para que GitTree escribiera un fichero arbitrario, rompiendo la garantía de que solo lee. Ahora hay dos barreras: el tipo `CommitHash`, que no admite un `string` sin pasar por `CommitHash.parse`, y `--end-of-options` antes del hash en las dos llamadas a git.

### Cambiado

- `@gittree/core` queda segmentado por entidad: una carpeta por entidad, un tipo público por fichero y un `index.ts` por paquete. Se expone además por subrutas (`@gittree/core/commit`, `/layout`, `/api`, `/ref`, `/repository`, `/collection`, `/common`); el barrel raíz plano se mantiene.
- `GitRepository` pasa a solo ejecutar comandos: el parseo sale a `RawCommitParser`, `CommitDetailParser`, `ChangedFileParser` y `RefParser`, junto a los formatos de los que dependen.
- `Row`, `Lane` y `ColorIndex` pasan a ser tipos marcados con `Brand`, igual que ya lo era `CommitHash`. `CommitNode` tiene tres números y `LaneEdge` cinco: sin marca, cruzarlos compilaba y dibujaba un grafo mal sin que nada fallara. La marca se borra al compilar, así que el JSON entre server y web no cambia.
- `MinHeap` es genérico (`MinHeap<T extends number>`), para ser un heap de `Lane` sin perder la marca ni pagar un comparador inyectado.
- Tipado más estricto: `noPropertyAccessFromIndexSignature`, `noUncheckedSideEffectImports`, `allowUnreachableCode: false` y `allowUnusedLabels: false` en todos los paquetes, más `isolatedDeclarations` en `core`.

### Pendiente

Empaquetado como aplicación de escritorio, diff línea a línea y búsqueda de commits. El seguimiento vive en [`specs/gittree-mvp/tasks.md`](specs/gittree-mvp/tasks.md).
