# PWA de inspecciones de laboratorio — proyecto del equipo

Comiencen por `START_HERE.md`. Este es un proyecto acumulativo: un repositorio privado por equipo durante el curso.

- **Semana 1** (`ACTIVIDAD-01.md`): arrancar el starter, documentar requisitos/decisión y explicar la verificación; no implementaba toda la PWA.
- **Semana 2** (`ASSIGNMENT.md`, *Actividad 2: App shell instalable y manifest*): sobre el mismo repositorio, se agregó el shell instalable — manifest válido, íconos, navegación principal accesible y los estados de carga, vacío y error de la interfaz. Es el incremento vigente de este README.

## Entorno

Node.js 20.19 o posterior compatible, npm 10 o posterior, Git y cuenta de GitHub. No se requiere Make.

### Versiones utilizadas por el equipo y CI
- **Arturo Castañeda Serrano:** Node `v22.22.2`, npm `10.9.7` (Linux).
- **José Ricardo Cruz Aguilar:** Node `v22.22.2`, npm `10.9.2` (Windows 10 / PowerShell).
- **Ariel Abimael Chacón Herrera:** Node `v24.16.0`, npm `10.9.2` (Windows 11 / PowerShell).
- **GitHub Actions (CI):** Node `v20.19.6`, npm `10.8.2` (Ubuntu Latest).

### Dificultades de entorno y consideraciones
- **Política de ejecución de scripts en PowerShell (Windows):** Al ejecutar `npm ci`, el sistema arrojó `PSSecurityException` al bloquear `npm.ps1`. Se resolvió ejecutando `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` en una terminal con permisos adecuados.
- **Permisos en subprocesos (`spawnSync`):** En entornos locales restringidos, `npm run verify` puede reportar fallos de permisos (`spawnSync npm EPERM`). Se aseguró la ejecución con los permisos correctos sobre el directorio y procesos hijos para validar `npm test` y `next build`.
- **Advertencias de deprecación en `tsconfig.json`:** TypeScript señala opciones deprecadas (`target: es5` y `baseUrl`). Se mantuvieron sin cambios para conservar la integridad del starter oficial de la Semana 1 y evitar discrepancias entre integrantes.
- **Vulnerabilidades en dependencias transitivas:** `npm ci` advierte de 2 vulnerabilidades altas en paquetes del starter. Se decidió no modificar `package.json` ni el lockfile provisto para no alterar el alcance de la entrega.

## Ejecución

```bash
npm ci
npm run dev
```

Abran `http://localhost:3000`. Verán el shell instalable (`src/components/app-shell.tsx`, con encabezado, navegación y pie de página accesibles) envolviendo la página de inicio. En "Inspecciones recientes" hay un simulador de estados (`src/app/page.tsx`) con cuatro botones para alternar manualmente entre:

- **Normal**: las tres inspecciones sintéticas.
- **Cargando**: skeletons accesibles (`role="status"`, `aria-busy="true"`).
- **Vacío**: mensaje y botón para volver a cargar datos sintéticos.
- **Error de conexión**: alerta (`role="alert"`, `aria-live="assertive"`) con botón "Reintentar consulta".

Detengan el servidor con Ctrl+C. Para comprobar la instalabilidad PWA: abran las DevTools → Application → Manifest, o el ícono de instalación de la barra de direcciones (Chrome/Edge).

## Verificación

```bash
npm run verify
```

Ejecuta `npm test` (tres pruebas: `tests/starter.spec.mjs`, `tests/manifest.spec.ts` y `tests/ui-states.spec.mjs`) y `npm run build`; genera `reports/verification.json`. El reporte contiene resultados técnicos y documentos para revisión, no una calificación automática. `make verify` es equivalente. `bash public-tests/check.sh` es un check opcional de estructura (el mismo que corre en CI como AC-02).

`tests/ui-states.spec.mjs` verifica, mediante aserciones sobre el código fuente de `page.tsx` (sin renderizar un DOM real), que existan y estén correctamente anunciados los cuatro estados de la interfaz (carga, vacío, error, listo) y que el botón de reintentar del estado de error pase primero por "cargando" antes de volver a "listo".

GitHub Actions ejecuta la misma verificación y permite descargar el artefacto `starter-week-01-evidence`. El reporte local se excluye de Git: adjúntenlo en Classroom o descarguen el del SHA entregado desde Actions.

## Trabajo y entrega en equipo

Inviten a los integrantes y al docente al mismo repositorio privado. Cada persona registra su evidencia en una sección de `evidence/individual.md`. Todos entregan en Classroom el mismo SHA final y enlaces, identificando su sección. El formato exacto está en `ACTIVIDAD-01.md`; no se requiere un pull request adicional ni una copia por alumno.

## Estructura y límites

- `src/app/`: pantalla Next.js (`layout.tsx` enlaza el manifest, `page.tsx` implementa el simulador de estados).
- `src/components/app-shell.tsx`: shell instalable (landmarks HTML5, skip-link, navegación, pie de página).
- `src/lib/data/`: inspecciones sintéticas.
- `public/manifest.webmanifest` + íconos: instalabilidad PWA (`name`, `short_name`, `display: standalone`, íconos 192/512).
- `docs/`: requisitos y decisión del equipo.
- `evidence/`: evidencia propia de cada integrante (una sección por persona en `individual.md`).
- `tests/`: `starter.spec.mjs` (regresión del starter), `manifest.spec.ts` (instalabilidad), `ui-states.spec.mjs` (estados de carga/vacío/error). No es una suite completa de comportamiento de toda la app.

Registren aquí sus supuestos y limitaciones de ejecución. El starter todavía no implementa offline real, service worker ni sincronización de backend: los estados de carga/vacío/error de la interfaz se disparan manualmente con el simulador de la página, no por fallas de red reales. Las pruebas de estados son aserciones estáticas sobre el código fuente (no montan un DOM ni simulan clics); una mejora futura razonable es incorporar jsdom + Testing Library para probar la interacción real. No incluyan datos personales reales en el producto, archivos `.env` ni credenciales. La identificación de integrantes se conserva en el repositorio privado y Classroom.
