# GitTree MVP — Requirements

**Feature slug:** `gittree-mvp`
**Base:** decisiones validadas en `INFORME-FASE-1.md`
**Fecha:** 2026-08-31

## Contexto

GitTree es un visor de árbol de commits para repositorios locales, *viewer-first*: su trabajo es leer y navegar el grafo, no operar sobre él. Todo lo que sigue describe el **qué** y el **por qué**; los componentes, clases y contratos viven en `design.md`.

## Glosario

| Término | Significado en este documento |
|---|---|
| **commit** | Un nodo del historial, identificado por su hash completo de 40 caracteres |
| **ref** | Puntero con nombre a un commit: branch local, branch remota, tag o HEAD |
| **lane** | Columna vertical del grafo donde se dibuja un commit |
| **row** | Posición vertical de un commit, según el orden topológico |
| **span** | Tramo de arista entre dos commits conectados |

---

## Requirement 1 — Abrir un repositorio local por su ruta

**Historia de usuario:** Como desarrollador, quiero indicar la ruta de un repositorio de mi máquina para que GitTree cargue su historial, de modo que pueda inspeccionar cualquier proyecto sin configuración previa.

### Criterios de aceptación

1. CUANDO el usuario introduce una ruta absoluta a un repositorio git válido y confirma, ENTONCES el sistema DEBERÁ cargar el historial y mostrar el grafo.
2. SI la ruta no existe en el sistema de archivos, ENTONCES el sistema DEBERÁ mostrar el mensaje "No existe esa ruta" junto a la ruta introducida, y no DEBERÁ intentar ejecutar git.
3. SI la ruta existe pero no es un repositorio git ni está dentro de uno, ENTONCES el sistema DEBERÁ mostrar "Esa carpeta no es un repositorio git".
4. SI la ruta apunta a un repositorio git sin ningún commit, ENTONCES el sistema DEBERÁ mostrar "Este repositorio todavía no tiene commits" en lugar de un grafo vacío sin explicación.
5. CUANDO el binario `git` no está disponible en el PATH del sistema, ENTONCES el sistema DEBERÁ indicarlo explícitamente en lugar de reportar un fallo genérico.
6. CUANDO el usuario introduce una ruta que contiene espacios o caracteres no ASCII, ENTONCES el sistema DEBERÁ tratarla correctamente sin requerir comillas ni escapes por parte del usuario.
7. MIENTRAS el historial se está cargando, el sistema DEBERÁ mostrar un estado de carga visible.

---

## Requirement 2 — Visualizar el árbol de commits

**Historia de usuario:** Como desarrollador, quiero ver el historial completo dibujado como un grafo, de modo que entienda de un vistazo cómo divergieron y convergieron las ramas.

### Criterios de aceptación

1. CUANDO se carga un repositorio, ENTONCES el sistema DEBERÁ mostrar los commits en orden topológico, garantizando que ningún commit aparezca por encima de alguno de sus descendientes.
2. CUANDO un commit tiene un único padre, ENTONCES el sistema DEBERÁ dibujar una arista que lo conecte con él.
3. CUANDO un commit tiene dos o más padres (merge), ENTONCES el sistema DEBERÁ dibujar una arista hacia **cada** uno de sus padres.
4. CUANDO un commit no tiene padres (raíz), ENTONCES el sistema DEBERÁ dibujarlo sin aristas descendentes y no DEBERÁ dejar su lane reservado.
5. CUANDO el repositorio contiene más de una raíz, ENTONCES el sistema DEBERÁ representarlas todas sin solaparlas.
6. CUANDO una arista conecta commits que están separados por más filas de las visibles en pantalla, ENTONCES el sistema DEBERÁ dibujar igualmente el tramo que atraviesa la zona visible.
7. El sistema DEBERÁ incluir en el grafo los commits alcanzables desde branches locales, branches remotas, tags y HEAD, y NO DEBERÁ incluir los commits propios del stash.
8. CUANDO el historial tiene 10.000 commits o más, ENTONCES el sistema DEBERÁ mantener el scroll fluido, sin recalcular el layout en cada frame.

---

## Requirement 3 — Distinguir ramas por lane y color

**Historia de usuario:** Como desarrollador, quiero que cada línea de desarrollo ocupe su propia columna con un color estable, de modo que pueda seguir una rama con la vista sin perderla entre cruces.

### Criterios de aceptación

1. CUANDO dos commits pertenecen a la misma línea de desarrollo, ENTONCES el sistema DEBERÁ dibujarlos en el mismo lane siempre que ninguna otra rama lo haya ocupado entretanto.
2. CUANDO una rama termina (porque se fusiona o porque se agota su historial), ENTONCES el sistema DEBERÁ liberar su lane para que lo reutilice una rama posterior.
3. CUANDO hay un lane libre, ENTONCES el sistema DEBERÁ asignar siempre **el más a la izquierda**, para que el grafo quede compacto y el resultado sea determinista.
4. CUANDO se recarga el mismo repositorio sin cambios, ENTONCES el sistema DEBERÁ producir exactamente las mismas posiciones y los mismos colores que la vez anterior.
5. CUANDO un commit merge une dos lanes, ENTONCES el sistema DEBERÁ dibujar la arista entrante desde el lane que se cierra hasta el lane que continúa, sin cruzar por encima de lanes activos intermedios.
6. El sistema DEBERÁ asignar colores de una paleta fija, reutilizándolos cíclicamente cuando el número de lanes la supere.

---

## Requirement 4 — Ver las etiquetas de refs sobre el grafo

**Historia de usuario:** Como desarrollador, quiero ver qué ramas y tags apuntan a cada commit, de modo que ubique dónde estoy y dónde están las demás líneas de trabajo.

### Criterios de aceptación

1. CUANDO un commit es el destino de una o más refs, ENTONCES el sistema DEBERÁ mostrar una etiqueta por cada ref junto a ese commit.
2. El sistema DEBERÁ distinguir visualmente los cuatro tipos de ref: branch local, branch remota, tag y HEAD.
3. CUANDO HEAD apunta a una branch, ENTONCES el sistema DEBERÁ señalar cuál es la branch activa.
4. CUANDO HEAD está en estado detached, ENTONCES el sistema DEBERÁ etiquetar ese commit como HEAD sin asociarlo a ninguna branch.
5. CUANDO un commit acumula tantas refs que sus etiquetas no caben en el ancho disponible, ENTONCES el sistema DEBERÁ evitar que desborden sobre el resto de la fila.

---

## Requirement 5 — Consultar el detalle de un commit

**Historia de usuario:** Como desarrollador, quiero seleccionar un commit y leer su información completa, de modo que entienda qué cambió sin salir a la terminal.

### Criterios de aceptación

1. CUANDO el usuario selecciona un commit, ENTONCES el sistema DEBERÁ mostrar su hash completo, autor, email, fecha de autoría, mensaje completo (asunto y cuerpo) y la lista de archivos modificados.
2. CUANDO el commit seleccionado es un **merge**, ENTONCES el sistema DEBERÁ mostrar igualmente su lista de archivos modificados, y NO DEBERÁ presentarla vacía.
3. CUANDO se muestra un archivo modificado, ENTONCES el sistema DEBERÁ indicar su tipo de cambio: añadido, modificado, eliminado o renombrado.
4. CUANDO un archivo fue renombrado, ENTONCES el sistema DEBERÁ mostrar tanto la ruta anterior como la nueva.
5. CUANDO el usuario selecciona otro commit, ENTONCES el sistema DEBERÁ reemplazar el detalle mostrado por el del nuevo commit.
6. CUANDO el usuario vuelve a seleccionar un commit ya consultado antes, ENTONCES el sistema DEBERÁ mostrar su detalle sin volver a leerlo del repositorio.
7. CUANDO un commit está seleccionado, ENTONCES el sistema DEBERÁ resaltarlo en el grafo.
8. MIENTRAS el detalle se está obteniendo, el sistema DEBERÁ indicarlo, y SI la obtención falla, DEBERÁ mostrar el error sin descartar el grafo ya cargado.

---

## Requirement 6 — Refrescar el grafo bajo demanda

**Historia de usuario:** Como desarrollador, quiero recargar el grafo cuando yo lo decida, de modo que vea los commits que acabo de hacer en la terminal sin reiniciar la herramienta.

### Criterios de aceptación

1. CUANDO el usuario activa la acción de refrescar, ENTONCES el sistema DEBERÁ releer el repositorio y redibujar el grafo con el estado actual.
2. CUANDO el refresco termina y el historial no ha cambiado, ENTONCES el sistema DEBERÁ conservar el commit seleccionado y la posición de scroll.
3. CUANDO el refresco termina y el commit que estaba seleccionado ya no existe, ENTONCES el sistema DEBERÁ limpiar la selección sin producir un error.
4. SI el refresco falla, ENTONCES el sistema DEBERÁ mostrar el error y mantener en pantalla el último grafo válido.
5. El sistema NO DEBERÁ refrescar por su cuenta: el refresco ocurre solo cuando el usuario lo pide.

---

## Requirement 7 — Ejecutarse igual en Windows y en Linux

**Historia de usuario:** Como desarrollador que trabaja en Windows y despliega en un VPS Ubuntu, quiero levantar GitTree con los mismos comandos en ambos entornos, de modo que no mantenga dos configuraciones.

### Criterios de aceptación

1. CUANDO el usuario ejecuta el comando de arranque documentado en Windows (PowerShell o Git Bash) o en Linux, ENTONCES el sistema DEBERÁ levantar backend y frontend con esa única orden.
2. El sistema DEBERÁ aceptar rutas con separador `\` y con separador `/`.
3. El sistema DEBERÁ funcionar sin requerir compilación de dependencias nativas ni toolchain adicional más allá de Node.js y git.
4. CUANDO se ejecuta en un servidor sin entorno gráfico, ENTONCES el sistema DEBERÁ seguir siendo accesible a través del navegador.

---

## Requirement 8 — Operar en modo solo lectura

**Historia de usuario:** Como desarrollador, quiero tener la certeza de que la herramienta no puede alterar mi repositorio, de modo que pueda abrir cualquier proyecto sin miedo a estropearlo.

### Criterios de aceptación

1. El sistema NO DEBERÁ ejecutar ninguna operación de git que modifique el repositorio: quedan excluidos commit, rebase, cherry-pick, merge, checkout, staging y resolución de conflictos.
2. El sistema NO DEBERÁ ejecutar comandos que accedan a la red, como fetch, pull o push.
3. CUANDO el sistema construye un comando de git, ENTONCES DEBERÁ pasar los argumentos como lista, sin interpolarlos en una cadena de shell.
4. CUANDO el sistema recibe una ruta de repositorio desde el cliente, ENTONCES DEBERÁ validarla antes de usarla como argumento.

---

## Fuera de alcance del MVP

Escritura sobre el repositorio (Requirement 8), visualización del diff línea a línea, búsqueda y filtrado de commits, operaciones de red, empaquetado como aplicación de escritorio, y autenticación o multiusuario.
