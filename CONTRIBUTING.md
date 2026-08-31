# Contribuir a GitTree

Gracias por querer echar una mano. Esta guía cubre el **proceso**: cómo preparar el entorno, cómo proponer un cambio y qué se espera de un PR.

Las reglas operativas —convenciones de código, invariantes que no se tocan, cómo se verifica— viven en **[`AGENTS.md`](AGENTS.md)** y en [`docs/steering/`](docs/steering). Están en un solo sitio a propósito: dos copias de la misma norma acaban diciendo cosas distintas. Léelas antes de escribir código.

## Preparar el entorno

```bash
pnpm install
```

```bash
pnpm dev
```

Los requisitos de versión están en el [README](README.md#requisitos), y los impone `engines` en `package.json`, que es la fuente real: si tu Node no llega, `pnpm install` falla solo.

Lo que sí conviene saber: **`pnpm install` nunca debería compilar nada nativo**. Si lo hace, es una regresión y merece un issue.

## Cómo proponer un cambio

El proyecto es **spec-first**. Antes de implementar algo, existe en [`specs/gittree-mvp/`](specs/gittree-mvp):

| Documento | Qué fija |
|---|---|
| `requirements.md` | El qué y el por qué, en formato EARS |
| `design.md` | Los componentes, sus contratos y sus trade-offs |
| `tasks.md` | Los pasos ordenados por dependencia |

Si tu cambio no encaja en ninguna tarea, lo primero es actualizar el spec. Y si al implementarlo descubres que el design estaba equivocado, se corrige el design — no se deja divergir del código.

1. Crea una rama desde `main`.
2. Implementa siguiendo las convenciones de [`AGENTS.md`](AGENTS.md).
3. Verifica: `pnpm typecheck && pnpm test && pnpm build`.
4. Abre el PR. `main` está protegida: hacen falta los cuatro checks de CI en verde.

Los commits siguen [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/), y el cuerpo explica **por qué**, no qué:

```
feat(core): implementa la asignacion de lanes del layout engine
fix(server): devuelve EMPTY_REPO en repos sin commits
```

## El listón de un PR

Lo que más se mira, por orden:

**¿Está verificado con números, no con impresiones?** Cada tarea del spec trae un criterio medible contra un repositorio real. Si tu cambio afecta a los datos, di qué medías antes y qué mides ahora. "Funciona" no es una verificación.

**Si tocas `packages/web`, ¿lo has mirado en el navegador?** El typecheck no basta. Dos bugs de este proyecto pasaban tests y typecheck: el asunto del commit se colapsaba a cero ancho al estrechar la ventana, y dos clases CSS colisionaban en la cascada.

**¿Respeta las fronteras?** Solo `GitRepository` habla con git. El núcleo no conoce HTTP ni React. El renderer no decide posiciones.

## Qué se rechaza por alcance

GitTree es un **visor**. No ejecuta operaciones que modifiquen el repositorio (commit, rebase, cherry-pick, merge, checkout, staging) ni que accedan a la red (fetch, pull, push).

Un PR que añada cualquiera de ellas se rechaza, y no por falta de calidad: esa garantía es una característica del producto. El razonamiento completo está en [`docs/steering/product.md`](docs/steering/product.md).

## Reportar un fallo

Si el fallo es **visual**, cuenta qué esperabas ver y qué viste.

Si es de **datos**, ayuda mucho la salida de:

```bash
git log --branches --tags --remotes HEAD --topo-order --oneline | head -20
```

en el repositorio afectado, junto con su número de commits, ramas y merges.
