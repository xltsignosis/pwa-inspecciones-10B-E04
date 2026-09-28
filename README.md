# PWA de inspecciones de laboratorio — proyecto del equipo

Comiencen por `START_HERE.md`. Este es un proyecto acumulativo: un repositorio privado por equipo durante el curso.

- **Semana 1** (`ACTIVIDAD-01.md`): arrancar el starter, documentar requisitos/decisión y explicar la verificación; no implementaba toda la PWA.
- **Semana 2** (`ASSIGNMENT.md`, *Actividad 2: App shell instalable y manifest*): sobre el mismo repositorio, se agregó el shell instalable — manifest válido, íconos, navegación principal accesible y los estados de carga, vacío y error de la interfaz.
- **Semana 3** (`ASSIGNMENT-semana03.md`, *Actividad 3: Service worker y consulta offline*): se agregó el service worker (`public/sw.js`) con precache, runtime cache versionado (cache-first/network-first) y limpieza de cachés viejas en `activate`; su registro (`src/lib/pwa/register-service-worker.ts` + `src/components/service-worker-registrar.tsx`); la documentación de la estrategia (`docs/cache-strategy.md`); y las pruebas de service worker/offline.
- **Semana 4** (`assignments/ASSIGNMENT-semana04.md`, *Actividad 4: Renderizado CSR/SSR con estados verificables*): se agregó un listado resuelto por un Server Component (`/inspecciones`, prerenderizado estáticamente por Next.js) y un detalle renderizado en cliente (`/inspecciones/[id]`, CSR), ambos con estados de carga, error y contenido; el componente compartido de estados (`src/components/loading-state.tsx`), la decisión documentada (`docs/rendering-decision.md`) y las pruebas de renderizado (`tests/rendering.spec.ts`). Es el incremento vigente de este README.

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

Detengan el servidor con Ctrl+C. Para comprobar la instalabilidad PWA: abran las DevTools → Application → Manifest, o el ícono de instalación de la barra de direcciones (Chrome/Edge). Para comprobar el comportamiento offline: hagan `npm run build && npm run start`, carguen la app una vez con red (para que el service worker precachee el shell), y luego en DevTools → Network marquen "Offline" y recarguen: la app debe seguir mostrando el shell precacheado en vez del error genérico del navegador (ver `docs/cache-strategy.md`).

### Rutas CSR y renderizado de servidor (Semana 4)

| Ruta | Renderizado | Cómo obtiene los datos | Estados |
|---|---|---|---|
| `/inspecciones` | Server Component sin `"use client"`; `○ Static` en el build actual | Lee los datos sintéticos durante el prerenderizado; el HTML llega completo | carga (`loading.tsx`), error, vacío y contenido |
| `/inspecciones/[id]` | CSR (Client Component con `"use client"`) | `fetch` en `useEffect` a `/api/inspecciones/[id]` (GET, 200 o 404) | carga, no encontrada, error de red con "Reintentar" y contenido |

Con `npm run dev` abran `http://localhost:3000/inspecciones` y entren a un registro. Para ver los estados del detalle:

- **Contenido:** `/inspecciones/inspection-001`.
- **No encontrada:** `/inspecciones/no-existe`.
- **Error de red:** en DevTools → Network bloqueen la petición `/api/inspecciones/...` (clic derecho → *Block request URL*) y recarguen; al desbloquear, "Reintentar" recupera el detalle.

Para comprobar la diferencia de renderizado, comparen el HTML crudo que manda el servidor (con `npm run build && npm run start`):

```bash
curl -s http://localhost:3000/inspecciones | grep -c "Laboratorio de Redes"                   # 1 o más: los datos ya vienen en el HTML
curl -s http://localhost:3000/inspecciones/inspection-001 | grep -c "Laboratorio de Redes"    # 0: CSR, los datos llegan después con fetch
```

Métrica de carga repetible (tabla de rutas de `npm run build`, Next.js 14.2.35):

| Ruta | Tipo | Tamaño | First Load JS |
|---|---|---:|---:|
| `/inspecciones` | ○ Static | 140 B | 87.4 kB |
| `/inspecciones/[id]` | ƒ Dynamic | 1.38 kB | 88.6 kB |

La ruta CSR envía aproximadamente 1.24 kB más de código propio y 1.2 kB más de First Load JS porque incluye la lógica de `fetch`, cancelación, reintento y estados que el listado resuelve antes de entregar su HTML. La justificación completa de cada decisión está en `docs/rendering-decision.md`.

## Verificación

```bash
npm run verify
```

Ejecuta `npm test` (las suites encadenadas en el script `test` de `package.json`: `tests/starter.spec.mjs`, `tests/manifest.spec.ts`, `tests/ui-states.spec.mjs`, `tests/service-worker.spec.ts`, `tests/offline.spec.ts` y, desde la Semana 4, `tests/rendering.spec.ts`) y `npm run build`; genera `reports/verification.json`. El reporte contiene resultados técnicos y documentos para revisión, no una calificación automática. `make verify` es equivalente. `bash public-tests/check.sh` es un check opcional de estructura (el mismo que corre en CI como AC-02).

`tests/ui-states.spec.mjs` verifica, mediante aserciones sobre el código fuente de `page.tsx` (sin renderizar un DOM real), que existan y estén correctamente anunciados los cuatro estados de la interfaz (carga, vacío, error, listo) y que el botón de reintentar del estado de error pase primero por "cargando" antes de volver a "listo".

`tests/service-worker.spec.ts` y `tests/offline.spec.ts` verifican, con el mismo enfoque de aserciones sobre el código fuente (sin un runtime de Service Worker real), que `public/sw.js` declare cachés versionadas, registre `install`/`activate`/`fetch`, limpie cachés viejas en `activate` y precachee una lista no vacía de recursos; y que exista manejo explícito de fallo de red (try/catch, fallback al shell precacheado, respuesta 503 de reserva) y que `register-service-worker.ts` no rompa la carga cuando el navegador no soporta service workers.

`tests/rendering.spec.ts` contiene las pruebas de renderizado de la Semana 4 (Server Component, ruta CSR y sus estados). Como no hay descubrimiento automático de specs, está agregado explícitamente a la cadena de `npm test` para correr en CI.

GitHub Actions ejecuta en cada push el workflow de la semana vigente (`.github/workflows/week-04-w04-csr-ssr.yml`: instalación limpia, build, existencia de artefactos y `npm test`) y publica el artefacto `academic-evidence-w04-csr-ssr`. El reporte local se excluye de Git: adjúntenlo en Classroom o descarguen el del SHA entregado desde Actions.

## Trabajo y entrega en equipo

Inviten a los integrantes y al docente al mismo repositorio privado. Cada persona registra su evidencia en una sección de `evidence/individual.md`. Todos entregan en Classroom el mismo SHA final y enlaces, identificando su sección. El formato exacto está en `ACTIVIDAD-01.md`; no se requiere un pull request adicional ni una copia por alumno.

## Estructura y límites

- `src/app/`: pantalla Next.js (`layout.tsx` enlaza el manifest y monta `ServiceWorkerRegistrar`, `page.tsx` implementa el simulador de estados).
- `src/app/inspecciones/page.tsx` + `loading.tsx`: listado como Server Component, prerenderizado estáticamente con los datos actuales.
- `src/app/inspecciones/[id]/page.tsx`: detalle CSR; `src/app/api/inspecciones/[id]/route.ts`: endpoint GET de solo lectura que lo alimenta.
- `src/components/loading-state.tsx`: componente compartido para los estados de carga, error y vacío de ambas rutas.
- `src/components/app-shell.tsx`: shell instalable (landmarks HTML5, skip-link, navegación, pie de página).
- `src/components/service-worker-registrar.tsx`: client component que invoca `registerServiceWorker()` al montar.
- `src/lib/data/`: inspecciones sintéticas.
- `src/lib/pwa/register-service-worker.ts`: registra `/sw.js`, comprueba soporte del navegador y captura errores de registro sin bloquear la carga.
- `public/sw.js`: service worker (precache, runtime cache versionado, fallback offline, limpieza de cachés viejas). Detalle de decisiones en `docs/cache-strategy.md`.
- `public/manifest.webmanifest` + íconos: instalabilidad PWA (`name`, `short_name`, `display: standalone`, íconos 192/512).
- `docs/`: requisitos, decisión del equipo, estrategia de caché (`cache-strategy.md`) y decisión de renderizado CSR/SSR (`rendering-decision.md`).
- `evidence/`: `individual.md` contiene la evidencia vigente de la Semana 4 y `individual-semana03.md` conserva la evidencia de la semana anterior.
- `tests/`: `starter.spec.mjs` (regresión del starter), `manifest.spec.ts` (instalabilidad), `ui-states.spec.mjs` (estados de carga/vacío/error), `service-worker.spec.ts` (ciclo de vida y cachés del SW), `offline.spec.ts` (fallback offline y registro sin bloquear la carga) y `rendering.spec.ts` (invariantes de renderizado y estados compartidos). No es una suite E2E completa de comportamiento en navegador.

Registren aquí sus supuestos y limitaciones de ejecución. Los estados de carga/vacío/error de la interfaz se disparan manualmente con el simulador de la página, no por fallas de red reales. Las pruebas de estados y las de service worker/offline son aserciones estáticas sobre el código fuente (no montan un DOM real, no simulan la Cache API ni un ciclo de vida real de Service Worker en un navegador); una mejora futura razonable es incorporar jsdom + Testing Library, o un entorno de pruebas con Service Worker real (p. ej. Playwright), para cubrir la interacción y el comportamiento en tiempo de ejecución. Esta semana tampoco se implementa sincronización de datos capturados sin conexión (queda para una semana futura).

Supuestos y límites de la Semana 4: los datos de ambas rutas son el mismo arreglo sintético de `src/lib/data/inspections.ts` (3 registros, sin base de datos ni API externa), por lo que el error del listado solo ocurriría si esa fuente fallara. Con la fuente local e inmutable actual, Next.js genera `/inspecciones` como contenido estático durante el build; si los datos cambiaran por petición sería necesario definir una política de caché o revalidación. En la ruta CSR una inspección inexistente responde HTTP 200 en la página (el 404 lo recibe el `fetch` a la API), y el contenido no viene en el HTML inicial, lo que la hace menos adecuada que el listado para buscadores o clientes sin JavaScript. Como `public/sw.js` aplica red primero con caché de respaldo a los GET del mismo origen, sin conexión el detalle puede mostrar la última respuesta de la API guardada en caché en lugar del estado de error. No incluyan datos personales reales en el producto, archivos `.env` ni credenciales. La identificación de integrantes se conserva en el repositorio privado y Classroom.
