# Contribuir a GitTree

## Entorno

```bash
pnpm install
pnpm dev
```

Necesitas Node 22.13+, pnpm 11+ y `git` en el `PATH`. No hay dependencias nativas: `pnpm install` nunca debería compilar nada.

Antes de abrir un PR:

```bash
pnpm typecheck
pnpm test
```

## Cómo trabajamos

El proyecto es **spec-first**. Antes de implementar algo, existe en `specs/gittree-mvp/`:

- `requirements.md` — el qué y el por qué, en formato EARS
- `design.md` — los componentes, sus contratos y sus trade-offs
- `tasks.md` — los pasos ordenados por dependencia

Si un cambio no encaja en ninguna tarea, lo primero es actualizar el spec. Cada tarea referencia los requisitos que cumple y trae un criterio de verificación concreto — casi siempre un número medible contra un repositorio real, no un "comprobar que funciona".

## Convenciones de código

Son obligatorias y no negociables, porque mantienen el código legible de forma consistente:

- **Código en inglés, comentarios en español.**
- **Cada comentario va en la línea anterior** a lo que explica, nunca al lado.
- **Estilo funcional**: `map`, `filter` y `reduce` antes que bucles explícitos.
- **SOLID**: una responsabilidad por clase. Si una clase necesita dos frases para explicarse, son dos clases.
- **TypeScript estricto.** Nada de `any`, nada de `@ts-ignore`.

```ts
// Convierte la cadena de refs de git en objetos tipados, descartando los alias
const refs = decoration
  .split(", ")
  .filter((entry) => entry !== "origin/HEAD")
  .map(parseRef);
```

## Límite de alcance

GitTree es un **visor**. No ejecuta operaciones que modifiquen el repositorio (commit, rebase, cherry-pick, merge, checkout, staging) ni que accedan a la red (fetch, pull, push). Un PR que añada cualquiera de ellas será rechazado: esa garantía es una característica del producto, no una limitación pendiente de resolver.

## Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/):

```
feat(core): implementa la asignacion de lanes del layout engine
fix(server): devuelve EMPTY_REPO en repos sin commits
docs(readme): corrige el comando de arranque en Windows
```

## Reportar un fallo

Si el fallo es visual, incluye qué esperabas ver y qué viste. Si es de datos, ayuda mucho el resultado de `git log --branches --tags --remotes HEAD --topo-order --oneline | head -20` en el repositorio afectado.
