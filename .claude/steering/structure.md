# Estructura del proyecto

```
git-ui/
├── .claude/
│   ├── launch.json            Arranca `pnpm dev` (los DOS servidores) en 5174
│   └── steering/              Este directorio
├── .github/
│   ├── workflows/ci.yml       Matriz Ubuntu + Windows × Node 22 + 24
│   ├── ISSUE_TEMPLATE/
│   └── dependabot.yml
├── specs/gittree-mvp/         requirements · design · tasks
├── INFORME-FASE-1.md          Investigación previa, con las mediciones
├── packages/
│   ├── core/                  TypeScript puro. Sin HTTP, sin React
│   │   ├── src/
│   │   │   ├── types.ts               Contratos compartidos por los tres paquetes
│   │   │   ├── GitRepository.ts        Única pieza que habla con git
│   │   │   ├── CommitGraph.ts          Modelo del DAG
│   │   │   ├── GraphLayoutEngine.ts    Posiciones: lanes, filas, aristas
│   │   │   ├── MinHeap.ts
│   │   │   ├── refs.ts                 Parseo de %D
│   │   │   └── index.ts                Barrel público
│   │   └── test/
│   │       └── fixtures.ts             DAG de referencia compartido
│   ├── server/                Fastify, solo lectura
│   │   └── src/
│   │       ├── index.ts                Arranque. Lee GITTREE_API_PORT
│   │       ├── routes.ts               Los dos endpoints
│   │       ├── RepositoryResolver.ts   Valida la ruta, no llama a git
│   │       └── DetailCache.ts          LRU sobre `${repoPath}:${hash}`
│   └── web/                   React + SVG
│       ├── vite.config.ts     Proxy /api. Lee GITTREE_API_PORT
│       └── src/
│           ├── App.tsx                 Estado: repo, layout, selección
│           ├── ApiClient.ts            HTTP + reintentos de conexión
│           ├── GraphRenderer.tsx       Pinta el layout
│           ├── CommitDetailPanel.tsx
│           ├── RepoPicker.tsx
│           ├── RefBadge.tsx
│           ├── useVirtualRows.ts       Ventana deslizante sobre las filas
│           ├── geometry.ts             Constantes de rejilla y trazado
│           └── styles.css
└── README.md · CHANGELOG.md · CONTRIBUTING.md
```

## Dónde va cada cosa

**¿Habla con git?** → `packages/core/src/GitRepository.ts`. Sin excepciones. Si otra pieza necesita preguntarle algo a git, se le añade un método estático a esta clase.

**¿Es un tipo que cruza la frontera cliente/servidor?** → `packages/core/src/types.ts`, y se exporta desde el barrel. Nunca se redeclara al otro lado.

**¿Calcula una posición, un lane o un color?** → `GraphLayoutEngine`. El renderer no decide posiciones.

**¿Es un valor de píxeles o un color hex?** → `packages/web/src/geometry.ts`. El engine emite *índices* de color, no colores.

**¿Valida entrada del usuario?** → `packages/server/src/RepositoryResolver.ts`, devolviendo un código de `RepoErrorCode` para que la interfaz dé un mensaje concreto.

## Tests

`packages/core/test/` y `packages/server/test/`. El DAG de referencia vive en `fixtures.ts` y lo comparten los tests que lo necesiten — no se duplica.

**`packages/web` no tiene tests todavía.** Es un hueco conocido: el reintento de `ApiClient` no está protegido contra regresiones.

## Ejecución

`pnpm dev` levanta backend y frontend. Un solo comando, idéntico en PowerShell, Git Bash y Linux. `.claude/launch.json` apunta ahí, no solo al frontend: arrancar solo Vite deja la aplicación sin API.
