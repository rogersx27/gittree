# Prompt: Investigación + MVP funcional de un visor de árbol Git ("GitTree")

## Rol
Eres un agente de ingeniería full-stack senior, especializado en herramientas de
desarrollo y visualización de grafos. Trabajas en dos fases claras: primero una
**investigación técnica** con fuentes actuales, y luego la construcción de un
**MVP funcional**. No mezcles las fases.

## Contexto
- **Objetivo:** una herramienta ligera, tipo GitKraken pero mínima, enfocada en
  *visualizar el árbol de commits y ramas* de un repositorio local para uso
  diario. Es **viewer-first** (leer y navegar el grafo), no un cliente git completo.
- **Entornos objetivo:** Windows (Git Bash / PowerShell / WSL) y Linux (VPS Ubuntu).
  La solución debe funcionar en ambos.
- **Stack preferido:** Node.js / TypeScript + React. Abierto a Tauri o Electron
  para empaquetar más adelante, pero el MVP debe priorizar el **camino más rápido
  a "funcional"**, no el empaquetado.

## Fase 1 — Investigación (entrega un informe breve ANTES de codear)
Investiga y decide, justificando con fuentes actuales:

1. **Lectura del repo:** compara `simple-git` (wrapper del CLI), `isomorphic-git`
   (JS puro, sin binario de git) y `nodegit` (bindings de libgit2). Criterio:
   fiabilidad cross-platform, velocidad y facilidad para obtener commits + padres
   + refs (branches, tags, HEAD).
2. **Algoritmo de layout del DAG (lo crítico):** cómo asignar cada commit a un
   lane/columna y trazar las aristas del grafo sin cruces feos. Revisa referencias
   open source: la extensión Git Graph de VS Code, `@gitgraph/js` y el propio
   `git log --graph`. Resume el algoritmo elegido en pseudocódigo.
3. **Render:** SVG vs Canvas, evaluando el rendimiento con cientos o miles de
   commits. Recomienda uno para el MVP.
4. **Arquitectura de ejecución:** cómo accede un frontend React a un repo local
   (thin backend en Node vs Tauri/Electron). Recomienda el camino más rápido a un
   MVP funcional y deja el empaquetado como fase posterior.

**Entregable de Fase 1:** informe de máximo una página con las decisiones
justificadas y el pseudocódigo del algoritmo de layout.

## Fase 2 — MVP funcional
Arquitectura por objetos, siguiendo SOLID (una responsabilidad por clase):

- **`GitRepository`** — abstrae la lectura del repo. Devuelve commits, padres y
  refs. Sin lógica de UI.
- **`CommitGraph`** — modelo puro del DAG (nodos, aristas, orden topológico). Sin
  dependencias de render.
- **`GraphLayoutEngine`** — recibe el `CommitGraph` y devuelve posiciones de nodos
  y aristas. Aquí vive la complejidad del layout.
- **`GraphRenderer`** (React) — solo pinta lo que el engine calculó. Reemplazable.

**Alcance funcional mínimo (debe correr y verse):**
- Abrir un repo local indicando su ruta.
- Renderizar el árbol: commits en orden topológico, lanes por rama con color,
  merges dibujados correctamente y etiquetas de refs (branches / tags / HEAD).
- Interacción básica: seleccionar un commit y ver su detalle (hash, autor, fecha,
  mensaje, archivos cambiados).
- Refrescar el grafo bajo demanda.

**Fuera de alcance del MVP:** operaciones de escritura (commit, rebase,
cherry-pick), staging y resolución de conflictos.

## Convenciones de código (obligatorias)
- Código en **inglés**; comentarios en **español**, cada comentario en la **línea
  anterior** a lo que explica (nunca al lado).
- Estilo **funcional**: preferir `map` / `filter` / `reduce` sobre bucles explícitos.
- **SOLID** y descomposición por objetos como se define arriba.
- **TypeScript** con tipado estricto.

## Entregables
- El informe de Fase 1.
- El repositorio del MVP con estructura clara, un README breve con los comandos
  para correrlo, y las cuatro clases núcleo separadas.
- Instrucciones de ejecución para Windows y Linux.

## Criterios de aceptación
- Corre en local y muestra el grafo de un repo real con al menos 2 ramas y 1 merge,
  de forma legible.
- Seleccionar un commit muestra su detalle real.
- El `GraphLayoutEngine` es testeable de forma aislada (incluye 1–2 tests que
  validen posiciones/lanes con un DAG de ejemplo).
- El código respeta las convenciones anteriores.

## Formato de trabajo
Trabaja **por partes**: primero entrega el informe de Fase 1 y espera validación;
luego implementa la Fase 2 clase por clase, mostrando cada pieza antes de integrarla.
