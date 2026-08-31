# GitTree

[![CI](https://github.com/rogersx27/gittree/actions/workflows/ci.yml/badge.svg)](https://github.com/rogersx27/gittree/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Visor ligero del árbol de commits y ramas de un repositorio git local. Tipo GitKraken, pero mínimo y **viewer-first**: su trabajo es leer y navegar el grafo, no operar sobre él.

> **Estado: MVP funcional.** Abre un repositorio, dibuja el grafo, muestra el detalle de un commit y refresca bajo demanda. Verificado contra un repositorio real de 110 commits con 13 merges. El progreso por tarea vive en [`specs/gittree-mvp/tasks.md`](specs/gittree-mvp/tasks.md).

## Por qué

Los clientes git de escritorio son pesados y hacen mucho más de lo que uno necesita en el día a día. GitTree hace una sola cosa: dibujar el historial de forma legible y dejarte inspeccionar un commit. Nada de escritura, nada de red.

Funciona en Windows y en Linux, y por ser una web local también sirve en un VPS sin entorno gráfico — donde una app de escritorio no correría.

## Requisitos

- **Node.js** 22.13 o superior (lo exige pnpm 11)
- **pnpm** 11 o superior (`corepack enable` lo instala desde el propio Node)
- **git** disponible en el `PATH`

## Arranque

```bash
pnpm install
```

```bash
pnpm dev
```

Eso levanta el backend (puerto 5175) y el frontend (puerto 5174) con una sola orden. Abre **http://localhost:5174**, escribe la ruta de un repositorio local y pulsa *Abrir*.

Los mismos dos comandos valen en PowerShell, en Git Bash y en Linux. Si trabajas contra un VPS sin escritorio, reenvía el puerto por SSH:

```bash
ssh -L 5174:localhost:5174 -L 5175:localhost:5175 usuario@tu-servidor
```

La ruta del repositorio se recuerda entre sesiones, así que al volver a abrir la página carga el último que mirabas.

### Comandos disponibles

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Levanta backend y frontend a la vez |
| `pnpm dev:server` | Solo el backend |
| `pnpm dev:web` | Solo el frontend |
| `pnpm typecheck` | TypeScript estricto en los tres paquetes |
| `pnpm test` | Tests del núcleo |
| `pnpm build` | Build de producción del frontend |

Si `pnpm dev` falla con `EADDRINUSE`, hay otra instancia ocupando 5174 o 5175. Cambia el puerto del backend con la variable `PORT`.

## Cómo funciona

Cuatro piezas con una responsabilidad cada una. El núcleo es TypeScript puro: no conoce HTTP ni React, y por eso el motor de layout se puede testear aislado.

| Pieza | Responsabilidad |
|---|---|
| `GitRepository` | Única parte que habla con git. Devuelve commits, padres y refs |
| `CommitGraph` | Modelo puro del DAG. Sin dependencias de render |
| `GraphLayoutEngine` | Convierte el DAG en posiciones: lanes, filas y aristas |
| `GraphRenderer` | Solo pinta en SVG lo que el engine calculó |

### Decisiones técnicas

Están justificadas y **medidas** en [`INFORME-FASE-1.md`](INFORME-FASE-1.md). Un resumen:

- **Lectura vía el CLI de git** (`simple-git`), no `libgit2` ni una reimplementación en JS. `nodegit` lleva desde 2020 sin release estable y exige compilar bindings nativos; `isomorphic-git` resuelve un problema que aquí no existe, porque git ya está instalado.
- **Layout por reserva de lanes**, la misma idea que usan `graph.c` de git y la extensión Git Graph de VS Code: un lane no pertenece a una rama, pertenece al commit padre que está esperando. Implementado con `Map` + min-heap en lugar de escaneo lineal, que degrada a O(N²) en repos con muchas ramas colgando de una base común (medido: 6.076 ms frente a 7 ms con 50.000 puntas de rama).
- **SVG, no canvas.** Las aristas se pintan completas y solo las filas se virtualizan: una rama larga atraviesa la ventana visible sin empezar ni terminar en ella, y recortarla la haría desaparecer. Medido en el navegador sobre un repositorio real: los `<path>` se mantienen en **122 en cualquier posición de scroll**, mientras los círculos y las filas varían entre 43 y 55 según la ventana. Total ~450 elementos, muy por debajo del umbral donde SVG se degrada.
- **Backend Node + navegador**, no Tauri ni Electron. El empaquetado es una fase posterior; el MVP prioriza el camino más corto a algo que funcione, y una web local es lo único que sirve además en un servidor sin escritorio.

## Estructura

```
packages/
├── core/      Núcleo puro: GitRepository, CommitGraph, GraphLayoutEngine
├── server/    Backend Fastify de solo lectura
└── web/       Interfaz React + SVG
specs/
└── gittree-mvp/   requirements · design · tasks
```

## Alcance

**Dentro:** abrir un repo por su ruta, renderizar el grafo con lanes de color y etiquetas de refs, seleccionar un commit y ver su detalle, refrescar bajo demanda.

**Fuera:** cualquier operación de escritura (commit, rebase, cherry-pick, staging, resolución de conflictos), operaciones de red, y el diff línea a línea. GitTree nunca modifica tu repositorio ni accede a la red.

## Licencia

[MIT](LICENSE)
