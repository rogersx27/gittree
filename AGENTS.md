# GitTree — instrucciones para agentes

Visor del árbol de commits y ramas de un repositorio git local. **Viewer-first**: lee y navega el grafo, nunca escribe ni accede a la red.

Este es el documento canónico para cualquier agente que trabaje en el repositorio. `CLAUDE.md` apunta aquí; no duplica contenido.

## Contexto del proyecto

Lee el documento de steering que corresponda antes de trabajar en su área:

- **[Producto](docs/steering/product.md)** — qué es, para quién, y qué queda deliberadamente fuera de alcance.
- **[Arquitectura](docs/steering/architecture.md)** — las cuatro piezas y sus fronteras, el algoritmo de layout y la estrategia de render.
- **[Stack](docs/steering/tech.md)** — versiones, por qué `simple-git`, y los flags de git que no son opcionales.
- **[Estructura](docs/steering/structure.md)** — dónde vive cada cosa y dónde va lo nuevo.
- **[Flujo de trabajo](docs/steering/workflow.md)** — convenciones, verificación con números reales, y el proceso de PR.

La especificación completa está en `specs/gittree-mvp/`, y las decisiones técnicas con sus mediciones en `INFORME-FASE-1.md`.

## Arranque

```bash
pnpm install
```

```bash
pnpm dev
```

Levanta el backend (5175) y el frontend (5174). Requiere Node >= 22.13, pnpm 11 y `git` en el `PATH`.

## Antes de abrir un PR

```bash
pnpm typecheck && pnpm test && pnpm build
```

## Convenciones de código

- Código en **inglés**, comentarios en **español**, cada comentario en la **línea anterior** a lo que explica, nunca al lado.
- Estilo funcional: `map`, `filter`, `reduce` antes que bucles explícitos.
- Una responsabilidad por clase.
- TypeScript estricto. Nada de `any`, nada de `@ts-ignore`.

## Lo que más caro sale si se ignora

**Tres flags de git que no se tocan.** Quitarlos no rompe nada visiblemente, solo devuelve datos mal:

- `--decorate=full` — sin él, la rama local `feature/api` y la remota `origin/api` son indistinguibles.
- `--first-parent -m` — sin ellos, los archivos de un merge salen **vacíos**.
- `--branches --tags --remotes HEAD` en vez de `--all` — `--all` arrastra `refs/stash`.

**Solo `GitRepository` ejecuta git**, y solo el paquete `core/src/repository/` conoce el formato de su salida. Si otra pieza necesita preguntarle algo a git, se le añade un método a esa clase.

**El hash de un commit no es un `string`, es un `CommitHash`.** `git show` trata como *opción* todo argumento que empiece por guion, y `--output=fichero` le hace **escribir en disco**. El hash llega de la URL: sin validar, un `GET` rompe la garantía de que GitTree solo lee. `CommitHash.parse` es la única puerta, y `--end-of-options` es la segunda barrera en las llamadas a git. No se relaja ninguna de las dos.

**Los tipos marcados del layout tampoco son decoración.** `Row`, `Lane` y `ColorIndex` son tres `number` que se cruzan sin que nada falle: el grafo sale mal dibujado y compila. Se construyen solo desde su fábrica (`Lane.of`). Detalle en [Estructura](docs/steering/structure.md).

**El núcleo va segmentado por entidad.** Una carpeta por entidad bajo `packages/core/src/`, un tipo público por fichero, el fichero llamado como lo que exporta, y un `index.ts` por carpeta que es su superficie pública. Desde fuera se importa por subruta: `@gittree/core/commit`, `/layout`, `/api`, `/ref`, `/repository`, `/common`. El detalle está en [Estructura](docs/steering/structure.md).

**Las aristas del grafo no se virtualizan.** Una rama larga atraviesa la ventana visible sin empezar ni terminar en ella; recortarla la haría desaparecer.

**Para cambios en `packages/web`, el typecheck no basta.** Se levanta la app, se mira en el navegador, y se mide el DOM cuando hay una invariante que comprobar.

**Se verifica con números medidos**, no con impresiones. Un merge del repositorio de referencia debe devolver 21 archivos; el grafo, 110 commits y 3 lanes. Cuando un número no cuadra, la primera pregunta es si falla el código o si fallaba la expectativa.

## Límite de alcance

GitTree es un visor. Un PR que añada escritura sobre el repositorio (commit, rebase, cherry-pick, staging) o acceso a la red (fetch, pull, push) se rechaza por alcance. Esa garantía es una característica del producto, no una limitación pendiente.

## Git

`main` está protegida: PR obligatorio, los 4 checks de CI en verde, historial lineal, sin force-push. El owner puede saltarse la protección; no se hace.

Commits en Conventional Commits, merge por squash.
