# Pruebas del proyecto

- `npm run test:unit`: descubre `tests/unit/*.test.ts`.
- `npm run test:integration`: descubre `tests/integration/*.test.ts`.
- `npm run test:legacy`: conserva las nueve suites anteriores, incluido sync.spec.ts.
- `npm test`: ejecuta las tres etapas y devuelve error si falla alguna.
- `npm run test:e2e`: Chromium con servidor de producción en 127.0.0.1:3100.
- `npm run verify`: lint, tipos, las capas anteriores, regresiones, build y E2E.

Los casos nuevos usan node:test y node:assert/strict. Las fixtures entregan
copias nuevas, identificadores y fecha fijos y datos sintéticos. Cada
integración crea su propia IDBFactory y servidor. El contexto del test
restaura fetch. No se necesitan red, cuentas, permisos físicos ni servidor.

`scripts/test-layer.mjs` conserva salida, código de retorno, SHA y estado del
árbol en `reports/week08/`; cobertura LCOV por capa en `coverage/week08/`.
Un SHA con workingTreeClean: false no identifica por sí solo los cambios
locales: consultar el diff de evidencia o la ejecución de CI.

La cobertura experimental de Node con tsx se refiere a módulos cargados y
puede mostrar líneas transformadas; no certifica toda la PWA ni incluye
módulos nunca importados. No se exige un porcentaje mínimo arbitrario.
La reapertura de fake-indexeddb no sustituye un E2E de recarga ni comprueba
cuotas, desalojo o service worker del navegador.

`tests/e2e/offline-capture.spec.ts` completa captura desde el formulario, recarga
offline y reconexión, variantes sin cámara y respuesta perdida tras el fetch real.
Cada prueba obtiene un contexto limpio; las operaciones usan identidades nuevas.
Se espera control y caché del service worker antes de desconectar, sin pausas fijas.
Los reportes HTML/JSON y trazas de fallos se conservan como artefactos de CI.

Estrategia: [`../docs/test-strategy.md`](../docs/test-strategy.md).
Experimento: [`../evidence/week08/defecto-controlado.md`](../evidence/week08/defecto-controlado.md).
