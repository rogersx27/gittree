# GitTree

[![CI](https://github.com/rogersx27/gittree/actions/workflows/ci.yml/badge.svg)](https://github.com/rogersx27/gittree/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Visor ligero del árbol de commits y ramas de un repositorio git local. Tipo GitKraken, pero mínimo y **viewer-first**: su trabajo es leer y navegar el grafo, no operar sobre él.

> **Estado: MVP funcional.** Abre un repositorio, dibuja el grafo, muestra el detalle de un commit y refresca bajo demanda. Verificado contra un repositorio real de 110 commits con 13 merges.

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

Los mismos dos comandos valen en PowerShell, en Git Bash y en Linux. La ruta del repositorio se recuerda entre sesiones, así que al volver a abrir la página carga el último que mirabas.

Si trabajas contra un VPS sin escritorio, reenvía los puertos por SSH:

```bash
ssh -L 5174:localhost:5174 -L 5175:localhost:5175 usuario@tu-servidor
```

### Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Levanta backend y frontend a la vez |
| `pnpm dev:server` | Solo el backend |
| `pnpm dev:web` | Solo el frontend |
| `pnpm typecheck` | TypeScript estricto en los tres paquetes |
| `pnpm test` | Tests del núcleo y del servidor |
| `pnpm build` | Build de producción del frontend |

Si `pnpm dev` falla con `EADDRINUSE`, hay otra instancia ocupando 5174 o 5175. El puerto del backend se cambia con la variable **`GITTREE_API_PORT`**, que leen tanto el servidor como el proxy del frontend.

## Cómo funciona

Cuatro piezas con una responsabilidad cada una. El núcleo es TypeScript puro: no conoce HTTP ni React, y por eso el motor de layout se puede testear aislado.

| Pieza | Responsabilidad |
|---|---|
| `GitRepository` | Única parte que habla con git. Devuelve commits, padres y refs |
| `CommitGraph` | Modelo puro del DAG. Sin dependencias de render |
| `GraphLayoutEngine` | Convierte el DAG en posiciones: lanes, filas y aristas |
| `GraphRenderer` | Solo pinta en SVG lo que el engine calculó |

Las decisiones de fondo, en corto:

- **Se lee con el CLI de git** (`simple-git`), no con bindings nativos ni una reimplementación en JS.
- **El layout asigna lanes por reserva de padres**, la misma idea que usan `graph.c` de git y la extensión Git Graph de VS Code.
- **Se dibuja en SVG**: las aristas se pintan completas y solo las filas se virtualizan.
- **Backend Node + navegador**, no Tauri ni Electron: es lo único que sirve además en un servidor sin escritorio.

Cada una está justificada **con mediciones** en [`INFORME-FASE-1.md`](INFORME-FASE-1.md), y desarrollada en [`docs/steering/architecture.md`](docs/steering/architecture.md) y [`docs/steering/tech.md`](docs/steering/tech.md).

## Alcance

**Dentro:** abrir un repositorio por su ruta, renderizar el grafo con lanes de color y etiquetas de refs, seleccionar un commit y ver su detalle, refrescar bajo demanda.

**Fuera:** cualquier operación de escritura (commit, rebase, cherry-pick, staging, resolución de conflictos), operaciones de red, y el diff línea a línea.

Que GitTree no pueda tocar tu repositorio es una característica del producto, no una limitación pendiente. El detalle está en [`docs/steering/product.md`](docs/steering/product.md).

## Documentación

| Dónde | Qué hay |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Instrucciones operativas del repositorio, para personas y agentes |
| [`docs/steering/`](docs/steering) | Producto, arquitectura, stack, estructura y flujo de trabajo |
| [`specs/gittree-mvp/`](specs/gittree-mvp) | Requirements, design y las 21 tareas de implementación |
| [`INFORME-FASE-1.md`](INFORME-FASE-1.md) | Investigación previa con las mediciones que respaldan las decisiones |

## Contribuir

Lee [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Licencia

[MIT](LICENSE)
