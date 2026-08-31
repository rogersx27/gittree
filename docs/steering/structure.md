# Estructura del proyecto

```
git-ui/
├── AGENTS.md                  Instrucciones canonicas para cualquier agente
├── CLAUDE.md                  Puntero a AGENTS.md, sin contenido propio
├── .claude/
│   └── launch.json            Arranca `pnpm dev` (los DOS servidores) en 5174
├── docs/steering/             Este directorio. Ruta neutra a proposito:
│                              el contexto no debe vivir bajo .claude/
├── .github/
│   ├── workflows/ci.yml       Matriz Ubuntu + Windows × Node 22 + 24
│   ├── ISSUE_TEMPLATE/
│   └── dependabot.yml
├── specs/gittree-mvp/         requirements · design · tasks
├── INFORME-FASE-1.md          Investigación previa, con las mediciones
├── packages/
│   ├── core/                  TypeScript puro. Sin HTTP, sin React
│   │   ├── src/               Un tipo por fichero, agrupados por entidad
│   │   │   ├── api/                    Contrato HTTP entre server y web
│   │   │   │   ├── ApiError.ts · ApiErrorCode.ts
│   │   │   │   ├── GraphResponse.ts · RepoErrorCode.ts
│   │   │   │   └── index.ts
│   │   │   ├── collection/             Estructuras genéricas, sin dominio
│   │   │   │   ├── MinHeap.ts          MinHeap<T extends number>
│   │   │   │   └── index.ts
│   │   │   ├── common/                 Utilidades a nivel de tipo. No existen
│   │   │   │   │                       en tiempo de ejecución
│   │   │   │   ├── Brand.ts            Brand<TBase, TTag>
│   │   │   │   ├── BrandFactory.ts     BrandFactory<TBase, TBranded>
│   │   │   │   ├── NonEmptyArray.ts · ReadonlyNonEmptyArray.ts
│   │   │   │   └── index.ts
│   │   │   ├── commit/                 El commit y lo que cuelga de él
│   │   │   │   ├── CommitHash.ts       Marcado: barrera de seguridad
│   │   │   │   ├── Person.ts · RawCommit.ts · CommitDetail.ts
│   │   │   │   ├── ChangedFile.ts · ChangeStatus.ts
│   │   │   │   ├── CommitGraph.ts      Modelo del DAG
│   │   │   │   └── index.ts
│   │   │   ├── layout/                 Posiciones: lanes, filas, aristas
│   │   │   │   ├── Row.ts · Lane.ts · ColorIndex.ts   Marcados
│   │   │   │   ├── CommitNode.ts · LaneEdge.ts · EdgeKind.ts
│   │   │   │   ├── GraphLayout.ts
│   │   │   │   ├── GraphLayoutEngine.ts
│   │   │   │   └── index.ts
│   │   │   ├── ref/                    La ref con nombre que apunta a un commit
│   │   │   │   ├── Ref.ts · RefKind.ts
│   │   │   │   └── index.ts
│   │   │   ├── repository/             Lo único que ejecuta git
│   │   │   │   ├── GitRepository.ts    Ejecuta los comandos, no parsea
│   │   │   │   ├── GitLogFormat.ts     Los formatos %H%x1f%P...
│   │   │   │   ├── GitStatusCode.ts    Unión cerrada: A M D R C T
│   │   │   │   ├── RawCommitParser.ts · CommitDetailParser.ts
│   │   │   │   ├── ChangedFileParser.ts · RefParser.ts
│   │   │   │   ├── GitNotAvailableError.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts                Barrel público plano
│   │   └── test/              Espeja las carpetas de src/
│   │       ├── fixtures.ts             DAG de referencia compartido
│   │       ├── collection/ · commit/ · layout/ · repository/
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

## Convención del núcleo

`packages/core` sigue una convención de paquetes: **una carpeta por entidad, un tipo público por fichero, y el fichero se llama exactamente como lo que exporta.** Cada carpeta tiene su `index.ts`, que es su superficie pública.

- **Dentro de un paquete** se importa fichero a fichero: `import type { Person } from "./Person"`.
- **Entre paquetes** se importa por el barrel: `import type { Ref } from "../ref"`. Así la dirección de las dependencias se lee de un vistazo y no aparecen ciclos.
- **Desde fuera de `core`** se importa por la subruta: `@gittree/core/commit`, `/layout`, `/api`, `/ref`, `/repository`, `/common`. Están declaradas en `exports` de su `package.json`. El barrel raíz `@gittree/core` sigue existiendo y reexporta todo plano.
- Las utilidades sin estado son clases con métodos estáticos y **constructor privado** (`RefParser.parse`, `ChangedFileParser.parse`): no se instancian, y el nombre del fichero sigue coincidiendo con el del tipo.

Los paquetes solo dependen hacia abajo: `api` → `commit` + `layout`; `layout` → `commit` + `collection` + `common`; `commit` → `ref` + `common`; `repository` → `commit` + `ref`. `ref`, `collection` y `common` no dependen de nadie.

## Tipos marcados

Cuatro tipos del núcleo no son su tipo base a secas, sino un `Brand<TBase, TTag>`:

| Tipo | Base | Qué impide |
|---|---|---|
| `CommitHash` | `string` | Que un valor de la URL llegue a `git show` sin validar |
| `Row` | `number` | Que una fila ocupe el sitio de un carril |
| `Lane` | `number` | Que un carril ocupe el sitio de una fila |
| `ColorIndex` | `number` | Que un índice de color pase por carril — salen de `lane % paletteSize`, así que con pocos carriles coinciden |

`CommitNode` tiene tres números y `LaneEdge` cinco. Sin marca, cruzarlos compila y produce un grafo mal dibujado sin que nada falle: es exactamente el tipo de error que un test no pilla y una revisión tampoco.

**Cómo se construye uno.** Solo desde su fábrica, que vive en el mismo fichero que el tipo: `Lane.of(3)`, `CommitHash.parse(raw)`. Ahí es donde está la aserción que el compilador no puede comprobar, una vez y con nombre, en vez de repartida. `CommitHash.unchecked` existe para la salida de git y los fixtures de test, y se llama así para que avise en cada punto de llamada.

**Qué NO va marcado.** `laneCount` y `rowCount` son cuentas, no posiciones, y siguen siendo `number`. La distinción importa: `graphWidth` recibe una cuenta y tiene que construir el último carril con `Lane.of`.

La marca se borra al compilar. El JSON entre server y web es idéntico al de antes.

## Dónde va cada cosa

**¿Ejecuta git?** → `packages/core/src/repository/GitRepository.ts`. Sin excepciones. Si otra pieza necesita preguntarle algo a git, se le añade un método a esta clase.

**¿Conoce el formato exacto de la salida de git?** → también `repository/`. El formato (`GitLogFormat`) y el parser que depende de su orden de campos viven juntos a propósito: separarlos es la forma más fácil de que dejen de cuadrar sin que nadie lo note.

**¿Es un tipo que cruza la frontera cliente/servidor?** → la carpeta de su entidad bajo `packages/core/src/`, en su propio fichero, exportado desde el `index.ts` del paquete. Nunca se redeclara al otro lado.

**¿Es un `number` o un `string` que podría confundirse con otro del mismo tipo?** → va marcado con `Brand`, con su fábrica en el mismo fichero. Ver arriba.

**¿Es una utilidad genérica a nivel de tipo?** → `packages/core/src/common/`. Nada de ahí existe en tiempo de ejecución.

**¿Calcula una posición, un lane o un color?** → `GraphLayoutEngine`. El renderer no decide posiciones.

**¿Es un valor de píxeles o un color hex?** → `packages/web/src/geometry.ts`. El engine emite *índices* de color, no colores.

**¿Valida entrada del usuario?** → `packages/server/src/RepositoryResolver.ts`, devolviendo un código de `RepoErrorCode` para que la interfaz dé un mensaje concreto.

## Tests

`packages/core/test/` y `packages/server/test/`. Los tests de `core` espejan las carpetas de `src/` y llevan el nombre de la clase que prueban (`test/repository/RefParser.test.ts`). El DAG de referencia vive en `test/fixtures.ts`, en la raíz de `test/` porque lo comparten varias carpetas — no se duplica.

**`packages/web` no tiene tests todavía.** Es un hueco conocido: el reintento de `ApiClient` no está protegido contra regresiones.

## Documentación de contexto

`AGENTS.md` es el documento canónico y `CLAUDE.md` solo apunta a él: así cualquier agente lee lo mismo y no hay dos versiones que puedan divergir. Los documentos de steering viven en `docs/steering/`, no bajo `.claude/`, precisamente para que no dependan de una herramienta concreta.

Si algo cambia, se cambia en `AGENTS.md` o en el steering correspondiente. Nunca en `CLAUDE.md`.

## Ejecución

`pnpm dev` levanta backend y frontend. Un solo comando, idéntico en PowerShell, Git Bash y Linux. `.claude/launch.json` apunta ahí, no solo al frontend: arrancar solo Vite deja la aplicación sin API.
