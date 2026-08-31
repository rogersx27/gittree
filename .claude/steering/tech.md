# Stack y decisiones técnicas

## Versiones

| Pieza | Versión | Nota |
|---|---|---|
| Node | **>= 22.13** | Lo exige pnpm 11, no es una preferencia |
| pnpm | 11.x | Fijado en `packageManager` |
| TypeScript | 7.x | Estricto, sin `any` ni `@ts-ignore` |
| React | 19 · Vite 8 | Frontend |
| Fastify | 5 | Backend |
| Vitest | 4 | Tests de `core` y `server` |

`pnpm install` **nunca debe compilar nada nativo**. Si un día lo hace, es una regresión: esa es la razón de no usar `nodegit`.

## Lectura del repositorio: el CLI de git vía `simple-git`

`nodegit` está descartado (sin release estable desde 2020, exige compilar libgit2). `isomorphic-git` resuelve funcionar *sin* git instalado, que aquí no aplica.

`simple-git` se usa casi solo por `.raw()`: su API tipada no expone bien `%P` ni `%D`. Lo que aporta es spawn seguro, cola de comandos y normalización de errores. Todo queda detrás de `GitRepository`, así que cambiar de motor es sustituir una clase.

## Invariantes de los comandos de git

Estos tres flags no son opcionales. Quitarlos produce **fallos silenciosos**: la interfaz sigue pareciendo correcta y los datos están mal.

**`--decorate=full`** al leer el grafo. Sin él, la rama local `feature/api` y la remota `origin/api` son indistinguibles: las dos llevan barra. El parseo depende de los prefijos `refs/heads/`, `refs/remotes/`, `refs/tags/`.

**`--first-parent -m`** al leer los archivos de un commit. Sin ellos git suprime el diff de los merges y `--name-status` devuelve **cero líneas**: todos los merges aparecerían sin archivos.

**`--branches --tags --remotes HEAD`, nunca `--all`.** `--all` arrastra `refs/stash`, que mete commits ajenos al historial. Ojo: un commit de stash tiene 2 o 3 padres, así que también cuenta como merge y falsea cualquier recuento.

Separadores: `NUL` entre registros (`-z`) y `US` (`\x1f`) entre campos. Ninguno puede aparecer dentro de un mensaje de commit.

## Puertos

- Frontend (Vite): **5174**
- Backend (Fastify): **5175**

El backend lee **`GITTREE_API_PORT`**, no `PORT` a secas. `vite.config.ts` lee la misma variable para el destino del proxy, así que no pueden discrepar. Esto no es cosmético: con `PORT` genérico, cualquier herramienta que lo inyecte para el frontend hace que el backend le robe el puerto y la aplicación cargue sin datos.

## Seguridad

- Los argumentos de git van **en array**, nunca interpolados en una cadena de shell.
- La ruta del repositorio se valida antes de usarse (`RepositoryResolver`).
- El backend escucha solo en loopback.

## Rendimiento, con números medidos

- Leer y parsear 110 commits: **68 ms**.
- Layout con índice `Map` + min-heap: el peor caso de 50.000 puntas de rama pasa de **6.076 ms a 7 ms**.
- Por debajo de ~16 lanes el escaneo lineal sería 1,4× más rápido; se acepta ese coste a cambio de eliminar el cliff.
- DOM del grafo: ~450 elementos, frente al umbral de 3.000–5.000 donde SVG se degrada.
