# Cómo se trabaja aquí

## Spec-first

Antes de implementar algo, existe en `specs/gittree-mvp/`:

- `requirements.md` — el qué y el por qué, en formato EARS
- `design.md` — componentes, contratos y trade-offs
- `tasks.md` — pasos ordenados por dependencia, con su criterio de verificación

Si un cambio no encaja en ninguna tarea, lo primero es actualizar el spec. Y si al implementar se descubre que el design estaba equivocado, **se corrige el design**, no se deja divergir del código.

## Convenciones de código, obligatorias

- **Código en inglés, comentarios en español.**
- **Cada comentario en la línea anterior** a lo que explica, nunca al lado.
- **Estilo funcional**: `map`, `filter`, `reduce` antes que bucles explícitos.
- **SOLID**: una responsabilidad por clase. Si necesita dos frases para explicarse, son dos clases.
- **TypeScript estricto.** Nada de `any`, nada de `@ts-ignore`.

Los flags activos son severos a propósito: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `noUnusedLocals`. Un acceso a array devuelve `T | undefined` y hay que comprobarlo.

## Verificar con números reales, no con impresiones

Es la práctica que más errores ha encontrado en este proyecto. Cada tarea de `tasks.md` trae un criterio numérico contra un repositorio real, no un "comprobar que funciona".

Ejemplos que estuvieron a punto de pasar en silencio:

- Un merge debe devolver **21 archivos**. Sin `--first-parent -m` devolvía 0, y en pantalla parecía normal.
- Leer el grafo debe devolver **110 commits**, no 112. Los otros dos son del stash.
- `laneCount` debe coincidir con las columnas de `git log --graph`.
- Los `<path>` del SVG deben mantenerse **constantes** al hacer scroll.

Cuando un número no cuadra, la primera pregunta es **si falla el código o si fallaba la expectativa**. Dos criterios de este proyecto estaban mal escritos y el código tenía razón.

## Mirar la pantalla

Para cualquier cambio en `packages/web`, el typecheck no basta. Estos dos bugs pasaban tests y typecheck:

- El asunto del commit se colapsaba a cero ancho al estrechar la ventana.
- Dos clases `.status` colisionaban en la cascada.

Se levanta la app, se mira, y se mide el DOM cuando hay una invariante que comprobar.

## Git y PRs

`main` está protegida: PR obligatorio, los 4 checks de CI en verde, historial lineal, sin force-push, `strict: true` (la rama debe estar al día con `main`).

El owner puede saltarse la protección con push directo, pero **no se hace**: si la protección está puesta, se usa.

Commits en [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/):

```
feat(core): implementa la asignacion de lanes
fix(server): devuelve EMPTY_REPO en repos sin commits
docs(readme): corrige el comando de arranque en Windows
```

El cuerpo explica **por qué**, no qué. Si el cambio corrige algo que solo se ve bajo ciertas condiciones, se dice cuáles.

Merge por squash, borrando la rama. Es la única estrategia habilitada.

## Dependabot

Con `strict: true`, mergear un PR deja los demás desactualizados. El procedimiento es uno a uno: `gh pr update-branch`, esperar la CI, mergear. Si hay conflicto en `pnpm-lock.yaml` —lo habrá, cada merge lo toca— se pide `@dependabot rebase` y se espera a que regenere el lockfile.

Los majors se mergean solo si la CI los ejercita de verdad. Antes de subir Vite de 7 a 8 hubo que añadir `pnpm build` a la CI: `typecheck` y `test` no tocan el empaquetado, y el salto habría pasado en verde sin probar nada.

## Antes de abrir un PR

```bash
pnpm typecheck && pnpm test && pnpm build
```

## Límite de alcance

GitTree es un visor. Un PR que añada escritura sobre el repositorio o acceso a la red se rechaza por alcance. Esa garantía es una característica del producto.
