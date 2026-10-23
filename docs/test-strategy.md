# Semana 08: estrategia de unitarias, integración y defecto controlado

## Alcance y diagnóstico inicial

Se conserva la PWA y sus nueve suites anteriores. Antes de modificar código,
`npm test` pasó fuera del aislamiento. Dentro del aislamiento, `tsx` no pudo
abrir su canal IPC (`listen EPERM`): es una restricción del entorno, no una
prueba aprobada ni un defecto de la PWA. El ejecutor nativo nuevo también
necesita crear subprocesos. Las ejecuciones definitivas usan esos permisos.

Ya existían IndexedDB con clave `clientId`, cola, servidor idempotente y
casos en `tests/sync.spec.ts`. Se conserva esa regresión y se agregan capas
separadas, fixtures HTTP y reportes. La regla de captura se extrae del servidor
a `src/lib/validation/inspection.ts`; `validateOperation` la consume antes de
guardar. No queda una función probada sin consumidor real.

La interfaz todavía no tiene captura completa conectada a IndexedDB. Estas
pruebas no demuestran crear desde el navegador: ese bloqueo y el E2E deben
resolverse con el flujo común del equipo.

## Matriz riesgo–prueba

| Riesgo | Capa y archivo | Aserciones y justificación |
| --- | --- | --- |
| Captura inválida | Unitarias: `tests/unit/inspection-validation.test.ts` | Acepta captura válida; rechaza ubicación vacía/espacios, inspector ausente, hallazgos negativos/fraccionarios/texto y estado inválido. La regla pura aísla las entradas. La entrada real del servidor rechaza sin guardar y acepta datos válidos. |
| Cambiar identidad al reintentar | Unitarias: `tests/unit/idempotency.test.ts` | Dos conversiones conservan clientId, versión y contenido sin modificar el original. Una operación repetida devuelve duplicate y una identidad inválida obtiene 400. |
| Pérdida offline | Integración: `tests/integration/offline-sync.test.ts`, caso de reapertura | Cola real, fetch sin red, nueva conexión a IndexedDB: igualdad de datos y estado pending. Comprueba colaboración de módulos, no solo el retorno de guardar. |
| Duplicación remota | Integración: mismo archivo, caso de respuesta perdida | El servidor guarda y se pierde la respuesta. Dos envíos iguales, un registro remoto, uno local synced, cola vacía y ningún tercer envío tras confirmar. |
| Duplicación local | Integración: mismo archivo, caso de guardar dos veces | Misma clave conserva un registro y el contenido actualizado; comprueba el contrato real del almacén. |
| Permisos del dispositivo | Regresión existente: `tests/capabilities.spec.ts` y `tests/geolocation.spec.ts`; E2E pendiente | Simulan denegación y API ausente. No demuestran completar captura desde navegador; el equipo debe agregar ese E2E. |
| Recarga y reconexión desde interfaz | E2E pendiente del equipo | Debe probar crear → guardar offline → recargar → reconectar → sincronizar. Estas capas no lo sustituyen. |

## Preparación y comandos

Local: Node 22.22.2, npm 10.9.7. Workflow de esta contribución: Node 22.22.2.
También se comprobaron ambas capas en Node 20.19.6 para conservar compatibilidad
con el CI anterior. En Node 20 no se aplica el filtro de cobertura por ruta:
su reporte incluye fixtures y pruebas; los porcentajes entre versiones no son comparables.

```bash
npm ci
npm run test:unit
npm run test:integration
npm test
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm run build
npm run verify
```

Los dos comandos por capa descubren sus archivos `.test.ts` y propagan el
código de fallo. `npm test` ejecuta ambas capas y `npm run test:legacy`.
`npm run verify` conserva el contrato existente de pruebas + build.
No hace falta servidor ni puertos: se sustituye fetch. El arranque del servidor
E2E debe documentarse al incorporar esa capa. Lint y el workflow general
quedan para la integración del equipo; no se declaran completos aquí.

## Fixtures y aislamiento

`tests/fixtures/inspection.ts` entrega objetos nuevos, identificadores y fecha
fijos. `tests/fixtures/sync-remote.ts` controla conexión y pérdida de una
respuesta después de guardar. Usa el servidor real y recibe el JSON que
produce `createFetchSender`; comprueba también `Idempotency-Key`. Solo se
sustituye fetch, sin solicitudes externas. Cada integración crea una fábrica
nueva de fake-indexeddb y un servidor nuevo. El contexto de Node restaura los
mocks; las conexiones abiertas directamente se cierran con finally.

## Reportes y CI

`.github/workflows/week-08-unit-integration.yml` instala dependencias y ejecuta
ambas capas como pasos obligatorios independientes. Integración corre aunque
fallen unitarias si la instalación pasó. Los fallos no se ocultan.
`if: always()` publica `week08-unit-integration-<SHA>` con resultados y cobertura,
incluso cuando falla una prueba.

Cada capa conserva `reports/week08/<capa>/output.txt` (aserciones y fallos),
`result.json` (estado, retorno, Node, fecha, SHA y limpieza del árbol), y
`coverage/week08/<capa>/lcov.info`. Se ignoran los generados en Git. El
experimento conserva copias históricas en `evidence/week08/`. CI corresponde
al SHA consultado y sus artefactos quedan sujetos a retención de GitHub.

La cobertura experimental corresponde a módulos importados, no a toda la PWA;
puede referir líneas transformadas por tsx. No incluye automáticamente módulos
nunca cargados ni usa un porcentaje mínimo para declarar aprobado el trabajo.

## Defecto, evidencia y límites

Preparación, modificación exacta, resultados y enlaces de fallo/recuperación:
[`../evidence/week08/defecto-controlado.md`](../evidence/week08/defecto-controlado.md).

El Map del servidor es por proceso; no demuestra persistencia remota entre
reinicios o instancias. fake-indexeddb no certifica cuotas, desalojo ni
persistencia de navegador real. No se prueban interfaz ni service worker en
estas capas. Solo se usan datos sintéticos, sin secretos ni cuentas externas.
