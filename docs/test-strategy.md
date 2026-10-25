# Semana 08: estrategia de pruebas y verificación completa

## Alcance y diagnóstico inicial

Se conserva la PWA y sus nueve suites anteriores. En el diagnóstico de Arturo,
`npm test` pasó fuera del aislamiento. Dentro del aislamiento, `tsx` no pudo
abrir su canal IPC (`listen EPERM`): es una restricción del entorno, no una
prueba aprobada ni un defecto de la PWA. El ejecutor nativo nuevo también
necesita crear subprocesos. Las ejecuciones definitivas usan esos permisos.

Ya existían IndexedDB con clave `clientId`, cola, servidor idempotente y
casos en `tests/sync.spec.ts`. Se conserva esa regresión y se agregan capas
separadas, fixtures HTTP y reportes. La regla de captura se extrae del servidor
a `src/lib/validation/inspection.ts`; `validateOperation` la consume antes de
guardar. No queda una función probada sin consumidor real.

Al revisar `439c122`, faltaban la captura conectada a IndexedDB, el E2E crítico,
lint y el workflow general. Los cuatro E2E de José cubrían contenido, estados
y denegación de cámara en el detalle; no completaban una captura. El workflow
de Arturo se había eliminado en `5c26ce7`, aunque sus enlaces históricos de
fallo y recuperación siguen siendo evidencia válida. Los checks verdes del
SHA inicial eran de semanas anteriores.

Ariel asume estrategia, CI y comandos, más la captura y los E2E faltantes.
`InspectionCapture`, montado en `/`, valida con la misma regla del servidor,
guarda con `createStoredInspection`/`enqueue` y muestra datos leídos de IndexedDB.
Los cambios confirmados de la cola notifican a la vista mediante un evento
local sin datos. Se conserva `clientId` al reintentar, sin cambiar el esquema.
El formulario conserva campos al fallar el almacenamiento y bloquea dobles envíos.

## Matriz riesgo–prueba

| Riesgo | Capa y archivo | Aserciones y justificación |
| --- | --- | --- |
| Captura inválida | Unitarias: `tests/unit/inspection-validation.test.ts` | Acepta captura válida; rechaza ubicación vacía/espacios, inspector ausente, hallazgos negativos/fraccionarios/texto y estado inválido. La regla pura aísla las entradas. La entrada real del servidor rechaza sin guardar y acepta datos válidos. |
| Cambiar identidad al reintentar | Unitarias: `tests/unit/idempotency.test.ts` | Dos conversiones conservan clientId, versión y contenido sin modificar el original. Una operación repetida devuelve duplicate y una identidad inválida obtiene 400. |
| Pérdida offline | Integración: `tests/integration/offline-sync.test.ts`, caso de reapertura | Cola real, fetch sin red, nueva conexión a IndexedDB: igualdad de datos y estado pending. Comprueba colaboración de módulos, no solo el retorno de guardar. |
| Duplicación remota | Integración: mismo archivo, caso de respuesta perdida | El servidor guarda y se pierde la respuesta. Dos envíos iguales, un registro remoto, uno local synced, cola vacía y ningún tercer envío tras confirmar. |
| Duplicación local | Integración: mismo archivo, caso de guardar dos veces | Misma clave conserva un registro y el contenido actualizado; comprueba el contrato real del almacén. |
| Permisos del dispositivo | Regresiones de capacidades y E2E `tests/e2e/offline-capture.spec.ts` | Denegación y API de cámara ausente: aparece la alternativa, se guarda sin foto, se recarga offline y se sincroniza. |
| Recarga y reconexión desde interfaz | E2E `tests/e2e/offline-capture.spec.ts` | Captura por formulario, `context.setOffline(true)`, recarga, mismos campos/clientId, reconexión y una sola fila sincronizada. Usa navegador, IndexedDB, service worker y endpoint reales. |
| Validación omitida por la interfaz | E2E de captura inválida | Un laboratorio con espacios conserva los campos y no inserta registros; complementa las entradas inválidas unitarias. |
| Respuesta perdida en navegador | E2E de respuesta perdida | Se ejecuta el fetch real y se descarta su primera respuesta exitosa. El reintento conserva el cuerpo y el servidor confirma `duplicate: true`. La integración también cuenta exactamente un registro remoto. |

## Preparación y comandos

Entorno de Arturo: Node 22.22.2, npm 10.9.7. Entorno de esta implementación:
Windows/PowerShell, Node 24.16.0, npm 11.13.0. Workflow completo: Node 22.22.2.
También se comprobaron ambas capas en Node 20.19.6 para conservar compatibilidad
con el CI anterior. En Node 20 no se aplica el filtro de cobertura por ruta:
su reporte incluye fixtures y pruebas; los porcentajes entre versiones no son comparables.

```bash
npm ci
npx playwright install chromium
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm test
npm run build
npm run test:e2e
npm run verify
```

Los dos comandos por capa descubren sus archivos `.test.ts` y propagan el
código de fallo. `npm test` ejecuta ambas capas y `npm run test:legacy`.
`npm run verify` es el equivalente exacto de `make verify`: ejecuta lint,
tipos, unitarias, integración, nueve suites de regresión, build y E2E. Conserva
salidas por etapa y devuelve código 1 ante cualquier fallo. Las comprobaciones
independientes continúan para conservar sus resultados; si falla el build se
omite E2E y la verificación falla. `--structure` solo comprueba rutas, no es
equivalente a verificar el comportamiento. En PowerShell puede usarse `npm.cmd`
en lugar de `npm`, sin cambiar la política de ejecución del sistema.

Unitarias e integración no necesitan servidor: sustituyen fetch. Playwright
usa Chromium, un worker, contextos nuevos por caso y servidor de producción
en `http://127.0.0.1:3100`. `npm run test:e2e` arranca
`npm run build && npm run start -- -H 127.0.0.1 -p 3100`; el ejecutor completo
pasa `E2E_SKIP_BUILD=1` después de compilar y arranca solo el servidor.
No se reutiliza un servidor que pudiera ejecutar otra versión.

Los E2E offline esperan `serviceWorker.ready`, control de la página y caché de
scripts/estilos antes de desconectar. El registro también funciona después de
`load`, y el service worker espera `cache.put` antes de completar su respuesta.
No se desactiva el service worker ni se reemplaza IndexedDB por una fixture.

## Fixtures y aislamiento

`tests/fixtures/inspection.ts` entrega objetos nuevos, identificadores y fecha
fijos. `tests/fixtures/sync-remote.ts` controla conexión y pérdida de una
respuesta después de guardar. Usa el servidor real y recibe el JSON que
produce `createFetchSender`; comprueba también `Idempotency-Key`. Solo se
sustituye fetch, sin solicitudes externas. Cada integración crea una fábrica
nueva de fake-indexeddb y un servidor nuevo. El contexto de Node restaura los
mocks; las conexiones abiertas directamente se cierran con finally.

## Reportes y CI

`.github/workflows/academic-evaluation.yml` instala con `npm ci`, prepara
Chromium con `npx playwright install --with-deps chromium` y ejecuta la
verificación completa. Se activa en push a `pwa-week-08`, pull request o ejecución
manual. No existe otro workflow vigente equivalente; los de semanas anteriores
se conservan. El antiguo `week-08-unit-integration.yml` solo corresponde a la
evidencia histórica del experimento.

`if: always()` publica `week08-verification-<SHA>` con resultados y cobertura,
incluso si una prueba falla, durante 14 días. Un fallo de instalación puede
impedir generar reportes; en ese caso se conserva el log fallido de Actions,
no se inventa un reporte aprobado. No se usa `continue-on-error`.

Cada capa conserva `reports/week08/<capa>/output.txt` (aserciones y fallos),
`result.json` (estado, retorno, Node, fecha, SHA y limpieza del árbol), y
`coverage/week08/<capa>/lcov.info`. Se ignoran los generados en Git. El
experimento conserva copias históricas en `evidence/week08/`. CI corresponde
al SHA consultado y sus artefactos quedan sujetos a retención de GitHub.

La verificación global escribe `reports/verification.json` y salidas en
`reports/week08/verify/`. E2E escribe JSON en `reports/week08/e2e/results.json`,
HTML en `playwright-report/` y trazas/capturas de fallos en `test-results/`.
Se ignoran los generados en Git. El artefacto y el reporte global identifican
el SHA; un reporte local con árbol modificado no demuestra ese SHA por sí solo.

La cobertura experimental corresponde a módulos importados, no a toda la PWA;
puede referir líneas transformadas por tsx. No incluye automáticamente módulos
nunca cargados ni usa un porcentaje mínimo para declarar aprobado el trabajo.

## Fallos encontrados durante la integración

- TypeScript con `target: es5` rechazó extender una NodeList; se usa `Array.from`
  sin modificar la configuración del starter.
- Lint detectó la vista previa `<img>` de la semana 6. Se documenta una excepción
  local porque usa un blob temporal, sin desactivar lint para la aplicación.
- La preparación E2E esperaba scripts `nomodule` que Chromium no solicita. Se
  comprueban los recursos que ese navegador usa y se informan las URL faltantes.
- Un selector exacto por etiqueta del select no encontraba Estado; se selecciona
  por rol y nombre accesible. La alerta de validación se delimita a la captura
  para evitar ambigüedad con el anunciador de rutas de Next.
- Las rutas relativas de los reportes se resolvían desde la configuración E2E;
  ahora se anclan a la raíz para que coincidan con los artefactos de Actions.

Estos fallos se diagnosticaron con salidas reales; no eran ejecuciones aprobadas.
Los reportes generados reflejan la última ejecución y no reemplazan la evidencia
histórica del experimento de Arturo.

## Defecto, evidencia y límites

Preparación, modificación exacta, resultados y enlaces de fallo/recuperación:
[`../evidence/week08/defecto-controlado.md`](../evidence/week08/defecto-controlado.md).

El Map del servidor es por proceso; no demuestra persistencia remota entre
reinicios o instancias. fake-indexeddb no certifica cuotas, desalojo ni
persistencia de navegador real; los E2E complementan esas capas en Chromium,
pero no certifican otros navegadores, cuotas o diálogos físicos. La foto es
temporal y no se guarda ni sincroniza. La pantalla de conflictos manuales y
la persistencia remota entre procesos siguen fuera del incremento. El simulador
y las rutas antiguas siguen usando sus tres ejemplos; los registros creados
se consultan en la sección local del inicio. Solo se usan datos sintéticos.
