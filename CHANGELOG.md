# Changelog

Todos los cambios notables de este proyecto se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y el versionado sigue [Semantic Versioning](https://semver.org/lang/es/).

## [Sin publicar]

### Añadido

- Workspace pnpm con tres paquetes: `@gittree/core`, `@gittree/server` y `@gittree/web` (tarea 0.1).
- Configuración de TypeScript estricta compartida, con `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` y `verbatimModuleSyntax`.
- Integración continua en GitHub Actions sobre Ubuntu y Windows, con Node 22 y 24.
- Informe de investigación técnica con las decisiones de arquitectura medidas (`INFORME-FASE-1.md`).
- Especificación completa del MVP en `specs/gittree-mvp/`: requirements en formato EARS, design y 21 tareas ordenadas por dependencia.

### Pendiente

El núcleo (`GitRepository`, `CommitGraph`, `GraphLayoutEngine`), el backend y la interfaz. El seguimiento vive en [`specs/gittree-mvp/tasks.md`](specs/gittree-mvp/tasks.md).
