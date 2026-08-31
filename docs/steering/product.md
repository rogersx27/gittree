# Producto

## Qué es GitTree

Un visor del árbol de commits y ramas de un repositorio git **local**. Tipo GitKraken, pero mínimo. Su trabajo es *leer y navegar* el grafo para uso diario, no ser un cliente git completo.

## Para quién

Un desarrollador que trabaja en Windows y despliega en un VPS Ubuntu, y quiere entender de un vistazo cómo divergieron y convergieron las ramas de un proyecto sin abrir un cliente pesado.

## La restricción que decide la arquitectura

**Un VPS Ubuntu no tiene escritorio.** Por eso GitTree es una web local y no una app nativa: una app de escritorio no correría ahí, una web sí (`ssh -L`). Cualquier propuesta que rompa esto —empaquetar solo como binario de escritorio, por ejemplo— hay que evaluarla contra este requisito antes que nada.

## Dentro de alcance

- Abrir un repositorio indicando su ruta.
- Renderizar el grafo: commits en orden topológico, lanes por rama con color, merges dibujados correctamente, etiquetas de refs (branches, tags, HEAD).
- Seleccionar un commit y ver su detalle: hash, autor, fecha, mensaje y archivos cambiados.
- Refrescar bajo demanda.

## Fuera de alcance, y por qué

**Escritura sobre el repositorio.** Nada de commit, rebase, cherry-pick, merge, checkout, staging ni resolución de conflictos. Que GitTree no pueda tocar tu repositorio es una **característica del producto**, no una limitación pendiente. Permite abrir cualquier proyecto sin pensárselo.

**Operaciones de red.** Ni fetch, ni pull, ni push.

**Diff línea a línea.** El detalle muestra qué archivos cambiaron y cómo (añadido, modificado, borrado, renombrado), no el contenido del cambio. Añadirlo arrastra resaltado de sintaxis y paginación, que es otro producto.

Un PR que añada cualquiera de estas tres cosas se rechaza por alcance, no por calidad.

## Decisiones de producto que ya se tomaron

- **Los archivos de un merge se calculan frente al primer padre.** Es la convención de GitHub y GitKraken para "qué trajo este merge". Significa que no se ven los cambios que venían de la rama fusionada y ya estaban en main.
- **El historial se lee entero de una vez**, con un límite por defecto de 10.000 commits. Paginar un grafo es complejo de verdad: una página no basta para dibujar las aristas que la cruzan. La respuesta trae `truncated` para avisar.
- **La altura de fila es fija.** Compra un indexado O(1) del scroll; el precio es que ninguna fila puede expandirse dentro del grafo, y por eso el detalle vive en un panel lateral.
