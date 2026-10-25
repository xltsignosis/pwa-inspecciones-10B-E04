# PWA de inspecciones de laboratorio — proyecto del equipo

Comiencen por `START_HERE.md`. Este es un proyecto acumulativo: un repositorio privado por equipo durante el curso.

- **Semana 1** (`ACTIVIDAD-01.md`): arrancar el starter, documentar requisitos/decisión y explicar la verificación; no implementaba toda la PWA.
- **Semana 2** (`ASSIGNMENT.md`, *Actividad 2: App shell instalable y manifest*): sobre el mismo repositorio, se agregó el shell instalable — manifest válido, íconos, navegación principal accesible y los estados de carga, vacío y error de la interfaz.
- **Semana 3** (`ASSIGNMENT-semana03.md`, *Actividad 3: Service worker y consulta offline*): se agregó el service worker (`public/sw.js`) con precache, runtime cache versionado (cache-first/network-first) y limpieza de cachés viejas en `activate`; su registro (`src/lib/pwa/register-service-worker.ts` + `src/components/service-worker-registrar.tsx`); la documentación de la estrategia (`docs/cache-strategy.md`); y las pruebas de service worker/offline.
- **Semana 4** (`assignments/ASSIGNMENT-semana04.md`, *Actividad 4: Renderizado CSR/SSR con estados verificables*): se agregó un listado resuelto por un Server Component (`/inspecciones`, prerenderizado estáticamente por Next.js) y un detalle renderizado en cliente (`/inspecciones/[id]`, CSR), ambos con estados de carga, error y contenido; el componente compartido de estados (`src/components/loading-state.tsx`), la decisión documentada (`docs/rendering-decision.md`) y las pruebas de renderizado (`tests/rendering.spec.ts`).
- **Semana 5** (`assignments/ASSIGNMENT.md`, *Actividad 5: Persistencia local y sincronización idempotente*): se agregó el almacenamiento local en IndexedDB (`src/lib/storage/schema.ts`), la cola de sincronización con reintentos y manejo de respuestas fuera de orden (`src/lib/sync/queue.ts`), la política de conflictos (`src/lib/sync/conflict-policy.ts`), un endpoint sintético idempotente (`POST /api/inspecciones/sync`), la documentación (`docs/sync-policy.md`) y las pruebas (`tests/sync.spec.ts`).
- **Semana 6** (`assignments/ASSIGNMENT-semana06.md`, *Actividad 6: Capacidades del dispositivo y notificaciones*): se agregaron la captura fotográfica, ubicación manual, aviso de cambio de estado, panel del detalle, documentación y pruebas de capacidades. Los permisos se piden solo al presionar cada botón y la app funciona sin ellos.

- **Semana 8** (`assignments/ASSIGNMENT-semana08.md`): incremento vigente. Captura real desde el inicio, persistencia y sincronización offline, pruebas por capas y verificación completa en CI. La semana 7 fue de evaluación, sin incremento nuevo.

## Entorno

Node.js 20.19 o posterior compatible, npm 10 o posterior, Git y cuenta de GitHub. No se requiere Make.

### Versiones utilizadas por el equipo y CI
- **Arturo Castañeda Serrano:** Node `v22.22.2`, npm `10.9.7` (Linux).
- **José Ricardo Cruz Aguilar:** Node `v22.22.2`, npm `10.9.2` (Windows 10 / PowerShell).
- **Ariel Abimael Chacón Herrera, semana 08:** Node `v24.16.0`, npm `11.13.0` (Windows / PowerShell).
- **GitHub Actions, semana 08:** Node `v22.22.2` (Ubuntu Latest); los workflows anteriores conservan su configuración.

### Dificultades de entorno y consideraciones
- **Política de ejecución de scripts en PowerShell (Windows):** Al ejecutar `npm ci`, el sistema arrojó `PSSecurityException` al bloquear `npm.ps1`. Se resolvió ejecutando `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` en una terminal con permisos adecuados.
- **Permisos en subprocesos (`spawnSync`):** En entornos locales restringidos, `npm run verify` puede reportar fallos de permisos (`spawnSync npm EPERM`). Se aseguró la ejecución con los permisos correctos sobre el directorio y procesos hijos para validar `npm test` y `next build`.
- **Advertencias de deprecación en `tsconfig.json`:** TypeScript señala opciones deprecadas (`target: es5` y `baseUrl`). Se mantuvieron sin cambios para conservar la integridad del starter oficial de la Semana 1 y evitar discrepancias entre integrantes.
- **Dependencias:** en semanas anteriores se registraron avisos del starter. En semana 08 se actualizan `package.json` y el lockfile para añadir lint compatible con Next 14. ESLint 8 y algunas dependencias transitivas están deprecados; una migración de Next queda fuera de este incremento. La instalación limpia no equivale a una auditoría de seguridad.

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

### Sincronización offline (Semana 5)

| Pieza | Qué hace |
|---|---|
| `src/lib/storage/schema.ts` | `StoredInspection` = `Inspection` + `clientId` (clave de idempotencia), `syncStatus` (`pending`/`synced`/`conflict`), `version`, `updatedAt`, `baseVersion` y `remoteCopy`; abre la base IndexedDB `laboratory-inspections`. |
| `src/lib/sync/queue.ts` | Cola persistente en IndexedDB: `enqueue`, `saveLocalEdit`, `getPending`, `markSynced`, `markConflict`, `syncPending` (reintentos sin duplicar, respuestas fuera de orden) y `startAutoSync` (al cargar y en cada evento `online`, con espera exponencial). |
| `src/lib/sync/conflict-policy.ts` | Base común + decisión manual: si solo cambió un lado gana ese lado; si cambiaron ambos queda `conflict` con las dos copias. No usa "el más reciente gana". |
| `src/app/api/inspecciones/sync/route.ts` + `src/lib/sync/server-store.ts` | Servidor sintético en memoria: valida (400), deduplica por `clientId` (200 `duplicate: true`) y devuelve 409 con su copia ante un conflicto. |
| `src/components/sync-registrar.tsx` | Client component montado en `layout.tsx` que arranca `startAutoSync`. |

Cómo verlo en el navegador (`npm run build && npm run start`): en DevTools → Application → IndexedDB → `laboratory-inspections` → `inspections` se ve cada registro con su `syncStatus`. Con DevTools → Network en "Offline" los envíos fallan y los registros siguen `pending`; al volver a "No throttling" el evento `online` dispara la sincronización y en la consola aparece `[sync] resultado { attempted, synced, conflicts, failed, requeued }`. La política completa, el mecanismo de idempotencia y la garantía de no pérdida están en `docs/sync-policy.md`.

### Capacidades del dispositivo y notificaciones (Semana 6)

| Pieza | Qué hace | Si se niega el permiso o no existe la API |
|---|---|---|
| `src/lib/device/camera.ts` | `captureEvidence()` toma un cuadro de la cámara trasera (video sin audio) y la apaga. | Devuelve `denied` / `unavailable`; se puede elegir una imagen o continuar sin foto. |
| `src/lib/device/geolocation.ts` | `getCurrentLocation()` hace una lectura puntual de latitud, longitud y precisión. | Devuelve `fallback: "manual"`; la ubicación se escribe a mano. |
| `src/lib/notifications/client.ts` | `notifyStatusChange()` muestra una notificación del sistema cuando una inspección cambia de estado. | Devuelve `fallback: "in-app"`; el cambio se muestra siempre dentro de la página. |
| `src/components/inspection-capabilities.tsx` | Panel "Evidencia y seguimiento" del detalle, con un botón por capacidad. | Muestra el aviso y la alternativa de cada caso. |

Cómo verlo en el navegador: con `npm run dev` abran `http://localhost:3000/inspecciones/inspection-001`. La página carga sin ningún aviso de permisos. Debajo de la tarjeta está el panel "Evidencia y seguimiento":

- **Marcar como «…»** cambia el estado, muestra el aviso en la página y, solo la primera vez, el navegador pregunta por las notificaciones. Al permitir aparece además la notificación del sistema; al bloquear, el aviso queda solo en la página.
- **Adjuntar foto** pide la cámara y muestra la vista previa. Al bloquear aparece "Elegir una imagen".
- **Usar mi ubicación** pide la ubicación y llena el campo. Al bloquear aparece el mensaje y el campo se sigue pudiendo escribir.

Para repetir un caso, cambien el permiso en el candado de la barra de direcciones → Configuración del sitio. Para ver el caso sin API, abran la app por HTTP con la IP de la red local en lugar de `localhost`: fuera de un contexto seguro `navigator.mediaDevices` no existe y el navegador bloquea ubicación y notificaciones. El detalle de cada caso, el principio de no pedir permisos al cargar y el riesgo residual están en `docs/capabilities.md`.

Costo medido en `npm run build`: con el panel, `/inspecciones/[id]` pasa de 1.38 kB a 3.58 kB (First Load JS de 88.6 kB a 90.8 kB). La tabla de la Semana 4 de arriba es anterior a este cambio; el listado `/inspecciones` no cambia (140 B, 87.4 kB) porque el panel solo se carga en el detalle.

## Verificación

### Semana 08: captura offline, pruebas y CI

Estrategia y diagnóstico: [`docs/test-strategy.md`](docs/test-strategy.md).

- `tests/unit/inspection-validation.test.ts`: captura válida/inválida y uso real en el servidor.
- `tests/unit/idempotency.test.ts`: identidad estable, duplicados e identidad inválida.
- `tests/integration/offline-sync.test.ts`: persistencia al reabrir IndexedDB, respuesta perdida/reintento y actualización de la misma clave local.
- `tests/fixtures/`: datos sintéticos y transporte controlado sobre el envío, cola y servidor reales.
- `tests/e2e/`: cuatro pruebas anteriores y cinco escenarios nuevos del flujo real, captura inválida, cámara denegada/ausente y respuesta perdida.
- `.github/workflows/academic-evaluation.yml`: instalación limpia y verificación completa, con reportes aun cuando una prueba falle.

```bash
npm ci
npx playwright install chromium
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm test
npm run test:e2e
npm run verify
```

`npm test` incluye las capas nuevas y las nueve suites anteriores
(`npm run test:legacy`). Se generan `reports/week08/{unit,integration}/`
(`output.txt`, `result.json`) y `coverage/week08/{unit,integration}/lcov.info`;
se ignoran en Git y se publican como artefactos de Actions. Estas dos capas
usan Node con tsx y no necesitan servidor ni puertos; sustituyen fetch.
Se añade ESLint 8.57.1 con configuración Next 14.2.35, y se conserva Playwright
1.64.1 del equipo. CI usa Node 22.22.2. Esta implementación se verifica en
Windows con Node 24.16.0 y npm 11.13.0; usa `npm.cmd` si PowerShell bloquea `npm.ps1`.

Rama temporal: `test/defecto-controlado`. Evidencia del fallo y recuperación:
[`evidence/week08/defecto-controlado.md`](evidence/week08/defecto-controlado.md).
El workflow del experimento fue eliminado en `5c26ce7`; los enlaces de fallo y
recuperación conservan su valor histórico. El workflow vigente es el completo
de esta semana, sin restaurar otro equivalente.

En `/`, completa **Registrar inspección** con datos sintéticos. **Guardar
inspección** confirma primero la escritura local; la sección **Inspecciones de
este dispositivo** muestra Pendiente, Sincronizada o Conflicto. Para comprobar
offline usa producción (`npm run build`, `npm run start`), carga una vez online
y espera la activación del service worker; desconecta, guarda y recarga. Al
reconectar se sincroniza conservando la identidad. La foto es opcional y temporal.
Los tres ejemplos del simulador y el listado antiguo siguen siendo demostraciones
separadas; los nuevos registros se consultan en la sección local del inicio.

`npm run test:e2e` construye y arranca `npm run start -- -H 127.0.0.1 -p 3100`.
Playwright administra y detiene ese servidor, sin reutilizar otro proceso.
Dentro de `verify` se usa el build recién generado (`E2E_SKIP_BUILD=1`).
Chromium usa service worker real y contextos nuevos por prueba. En Linux sin
dependencias del navegador usa `npx playwright install --with-deps chromium`,
como CI. Se genera HTML en `playwright-report/`, JSON en
`reports/week08/e2e/results.json` y trazas/capturas de fallos en `test-results/`.


```bash
npm run verify
```

Ejecuta lint, tipos, unitarias, integración, las nueve suites anteriores, build y
E2E. Genera `reports/verification.json` y logs por etapa en `reports/week08/verify/`.
Continúa las comprobaciones independientes al detectar un fallo; E2E requiere
build aprobado. Termina con código 1 si alguna comprobación obligatoria falla.
El reporte contiene resultados técnicos, no una calificación automática.
`make verify` ejecuta exactamente `npm run verify`; no hace falta instalar Make
en Windows. La instalación limpia y la preparación de Chromium son pasos previos.

`tests/ui-states.spec.mjs` verifica, mediante aserciones sobre el código fuente de `page.tsx` (sin renderizar un DOM real), que existan y estén correctamente anunciados los cuatro estados de la interfaz (carga, vacío, error, listo) y que el botón de reintentar del estado de error pase primero por "cargando" antes de volver a "listo".

`tests/service-worker.spec.ts` y `tests/offline.spec.ts` verifican, con el mismo enfoque de aserciones sobre el código fuente (sin un runtime de Service Worker real), que `public/sw.js` declare cachés versionadas, registre `install`/`activate`/`fetch`, limpie cachés viejas en `activate` y precachee una lista no vacía de recursos; y que exista manejo explícito de fallo de red (try/catch, fallback al shell precacheado, respuesta 503 de reserva) y que `register-service-worker.ts` no rompa la carga cuando el navegador no soporta service workers.

`tests/rendering.spec.ts` contiene las pruebas de renderizado de la Semana 4 (Server Component, ruta CSR y sus estados). Como no hay descubrimiento automático de specs, está agregado explícitamente a la cadena de `npm test` para correr en CI.

`tests/sync.spec.ts` (Semana 5) sí ejecuta comportamiento: usa una IndexedDB en memoria (`fake-indexeddb`, devDependency) y el servidor sintético de `server-store.ts`, sin red ni servicios externos. Tiene 9 casos: la misma clave de idempotencia enviada dos veces no duplica (también cuando se pierde la respuesta), una operación sin red permanece en la cola, el conflicto local + remoto conserva ambas copias, la cola sobrevive a reabrir la base, una respuesta vieja no marca como sincronizada una edición nueva, las respuestas en desorden se aplican a su propio registro y el servidor rechaza payloads inválidos. Se ejecuta sola con `npx tsx tests/sync.spec.ts`.

`tests/capabilities.spec.ts` (Semana 6) también ejecuta comportamiento: simula `navigator`, `Notification` y `document` en Node, sin diálogos reales ni red. Tiene 11 casos: importar los módulos no pide permisos; sin las APIs ninguna función lanza y cada una devuelve su alternativa; la cámara distingue permiso denegado de fallo del dispositivo, pide solo video y siempre se apaga; la ubicación devuelve solo coordenadas y precisión o la captura manual; las notificaciones no vuelven a pedir un permiso denegado, lo piden una sola vez en el primer cambio, no insisten si se cierra el aviso, llevan solo laboratorio y estado, y caen al aviso en la app si mostrar la notificación falla; y la interfaz solo invoca las capacidades desde un botón. `tests/geolocation.spec.ts` cubre además el timeout y los fallos síncronos de la ubicación. Se ejecutan solas con `npx tsx tests/capabilities.spec.ts` y `npx tsx tests/geolocation.spec.ts`.

GitHub Actions ejecuta el workflow vigente `.github/workflows/academic-evaluation.yml`
en push a `pwa-week-08` y en pull requests. Publica `week08-verification-<SHA>`
con resultados, cobertura LCOV y reportes E2E durante 14 días, usando `if: always()`.
Consulta [las ejecuciones de semana 08](https://github.com/xltsignosis/pwa-inspecciones-10B-E04/actions/workflows/academic-evaluation.yml?query=branch%3Apwa-week-08)
y selecciona la del commit que estés revisando. Los workflows de semanas anteriores
se conservan y su estado verde por sí solo no acredita los E2E nuevos.

## Trabajo y entrega en equipo

Inviten a los integrantes y al docente al mismo repositorio privado. Cada persona registra su evidencia en una sección de `evidence/individual.md`. Todos entregan en Classroom el mismo SHA final y enlaces, identificando su sección. El formato exacto está en `ACTIVIDAD-01.md`; no se requiere un pull request adicional ni una copia por alumno.

## Estructura y límites

- `src/app/`: pantalla Next.js (`layout.tsx` enlaza el manifest y monta los registradores; `page.tsx` monta la captura local y conserva el simulador).
- `src/components/inspection-capture.tsx`: formulario real y listado de registros de IndexedDB; `src/lib/storage/events.ts` notifica escrituras confirmadas a la vista.
- `src/app/inspecciones/page.tsx` + `loading.tsx`: listado como Server Component, prerenderizado estáticamente con los datos actuales.
- `src/app/inspecciones/[id]/page.tsx`: detalle CSR; `src/app/api/inspecciones/[id]/route.ts`: endpoint GET de solo lectura que lo alimenta.
- `src/components/inspection-capabilities.tsx`: panel del detalle para adjuntar foto, tomar la ubicación y cambiar el estado con aviso.
- `src/lib/device/`: cámara (`camera.ts`) y ubicación (`geolocation.ts`); `src/lib/notifications/client.ts`: aviso de cambio de estado. Ninguno pide permisos al importarse.
- `src/components/loading-state.tsx`: componente compartido para los estados de carga, error y vacío de ambas rutas.
- `src/components/app-shell.tsx`: shell instalable (landmarks HTML5, skip-link, navegación, pie de página).
- `src/components/service-worker-registrar.tsx`: client component que invoca `registerServiceWorker()` al montar.
- `src/lib/data/`: inspecciones sintéticas.
- `src/lib/storage/schema.ts`: esquema IndexedDB de las inspecciones guardadas en el dispositivo.
- `src/lib/sync/`: cola de sincronización (`queue.ts`), política de conflictos (`conflict-policy.ts`) y servidor sintético (`server-store.ts`); `src/app/api/inspecciones/sync/route.ts` lo expone como `POST`; `src/components/sync-registrar.tsx` arranca la sincronización automática.
- `src/lib/pwa/register-service-worker.ts`: registra `/sw.js`, comprueba soporte del navegador y captura errores de registro sin bloquear la carga.
- `public/sw.js`: service worker (precache, runtime cache versionado, fallback offline, limpieza de cachés viejas y, desde la Semana 6, `notificationclick` para abrir la inspección notificada). Detalle de decisiones en `docs/cache-strategy.md`.
- `public/manifest.webmanifest` + íconos: instalabilidad PWA (`name`, `short_name`, `display: standalone`, íconos 192/512).
- `docs/`: requisitos, decisión del equipo, estrategia de caché (`cache-strategy.md`), decisión de renderizado CSR/SSR (`rendering-decision.md`), política de sincronización (`sync-policy.md`) y capacidades del dispositivo (`capabilities.md`).
- `evidence/`: `individual.md` contiene la evidencia vigente de la Semana 8; los archivos `individual-semanaXX.md` conservan las semanas anteriores.
- `tests/`: nueve suites de regresión de las semanas anteriores, más `unit/`, `integration/`, `fixtures/` y `e2e/`. La estrategia distingue las aserciones estáticas antiguas del comportamiento real probado en Node y Chromium.

Los estados de carga/vacío/error del simulador se disparan manualmente. Las pruebas
antiguas de estados y service worker son aserciones estáticas; los E2E nuevos
complementan esa cobertura con Chromium, recarga offline e IndexedDB real.
Supuestos y límites de la Semana 4: los datos de ambas rutas son el mismo arreglo sintético de `src/lib/data/inspections.ts` (3 registros, sin base de datos ni API externa), por lo que el error del listado solo ocurriría si esa fuente fallara. Con la fuente local e inmutable actual, Next.js genera `/inspecciones` como contenido estático durante el build; si los datos cambiaran por petición sería necesario definir una política de caché o revalidación. En la ruta CSR una inspección inexistente responde HTTP 200 en la página (el 404 lo recibe el `fetch` a la API), y el contenido no viene en el HTML inicial, lo que la hace menos adecuada que el listado para buscadores o clientes sin JavaScript. Como `public/sw.js` aplica red primero con caché de respaldo a los GET del mismo origen, sin conexión el detalle puede mostrar la última respuesta de la API guardada en caché en lugar del estado de error. No incluyan datos personales reales en el producto, archivos `.env` ni credenciales. La identificación de integrantes se conserva en el repositorio privado y Classroom.

Supuestos y límites de sincronización: el servidor es un `Map` en memoria del
proceso de Next.js; se vacía al reiniciar y no se comparte entre instancias.
La captura de semana 08 conecta la cola al inicio; sigue pendiente la pantalla
para resolver conflictos manualmente. Un registro en `conflict` conserva las
copias y no se reenvía solo. fake-indexeddb no reproduce cuotas ni desalojo;
los E2E agregan persistencia y recarga en Chromium, sin certificar todos los
navegadores. Detalle en `docs/sync-policy.md` y `docs/test-strategy.md`.

Supuestos y límites de la Semana 6: cámara, ubicación y notificaciones son opcionales y solo funcionan en HTTPS o `localhost`. La foto, la ubicación y el cambio de estado viven en el estado de la página y se pierden al recargar; todavía no se guardan en IndexedDB ni entran en la cola de sincronización. La notificación es local (Notifications API): no llega con la app cerrada ni a otros dispositivos, porque un push remoto requiere un servidor y credenciales que este repositorio no incluye. Si un permiso quedó bloqueado, solo la persona puede reactivarlo desde la configuración del sitio. Las pruebas simulan las APIs en Node y no sustituyen la revisión manual de los diálogos de permiso en un navegador real. Detalle en `docs/capabilities.md`.
