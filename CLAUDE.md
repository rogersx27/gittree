# GitTree

Visor del árbol de commits y ramas de un repositorio git local. **Viewer-first**: lee y navega el grafo, nunca escribe ni accede a la red.

## Contexto del proyecto

Lee el fichero de steering que corresponda antes de trabajar en su área:

- **[Producto](.claude/steering/product.md)** — qué es, para quién, y qué queda deliberadamente fuera de alcance.
- **[Arquitectura](.claude/steering/architecture.md)** — las cuatro piezas y sus fronteras, el algoritmo de layout y la estrategia de render.
- **[Stack](.claude/steering/tech.md)** — versiones, por qué `simple-git`, y los flags de git que no son opcionales.
- **[Estructura](.claude/steering/structure.md)** — dónde vive cada cosa y dónde va lo nuevo.
- **[Flujo de trabajo](.claude/steering/workflow.md)** — convenciones, verificación con números reales, y el proceso de PR.

La especificación completa está en `specs/gittree-mvp/`, y las decisiones técnicas con sus mediciones en `INFORME-FASE-1.md`.

## Lo mínimo que hay que saber

**Convenciones**: código en inglés, comentarios en español **en la línea anterior** a lo que explican. Estilo funcional. TypeScript estricto, sin `any` ni `@ts-ignore`.

**Antes de abrir un PR**:

```bash
pnpm typecheck && pnpm test && pnpm build
```

**Tres flags de git que no se tocan.** Quitarlos no rompe nada visiblemente, solo devuelve datos mal:

- `--decorate=full` — sin él, la rama local `feature/api` y la remota `origin/api` son indistinguibles.
- `--first-parent -m` — sin ellos, los archivos de un merge salen **vacíos**.
- `--branches --tags --remotes HEAD` en vez de `--all` — `--all` arrastra `refs/stash`.

**Para cambios en `packages/web`, el typecheck no basta.** Se levanta la app con `pnpm dev`, se mira en el navegador y se mide el DOM cuando hay una invariante que comprobar.

**`main` está protegida.** PR obligatorio y los 4 checks de CI en verde. El owner puede saltársela; no se hace.
