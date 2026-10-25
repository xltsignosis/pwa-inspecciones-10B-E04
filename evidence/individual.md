# Evidencia individual · semana 8

## Nombre:

- Grupo y equipo:
- Mi contribución de esta semana y enlace:
- Decisión técnica y motivo:
- Prueba/comando que ejecuté:
- Resultado observado y enlace al reporte:
- Qué demuestra y qué no demuestra:
- Limitación o riesgo:
- IA: herramienta, propósito, partes influidas y validación propia; o «no utilicé IA»:

El SHA final común se entrega en Classroom tras el último commit. No inserten ese SHA en un nuevo commit para intentar identificar el mismo archivo.

---

## Arturo Castañeda Serrano · Unitarias, integración y defecto controlado

- Grupo y equipo: 10B - Equipo E04.
- Contribución concreta: regla compartida `src/lib/validation/inspection.ts`,
  `tests/unit/`, `tests/integration/`, `tests/fixtures/`, ejecutor
  `scripts/test-layer.mjs` y workflow `week-08-unit-integration.yml`.
- Link a la contribución: https://github.com/xltsignosis/pwa-inspecciones-10B-E04/commit/8baa166
  Estrategia: [docs/test-strategy.md](../docs/test-strategy.md).
- Decisión y motivo: conservar la suite anterior y probar resultados reales
  con el ejecutor de Node y fake-indexeddb ya disponibles. El fixture controla
  solo fetch; la validación, cola, serialización y servidor son los de la app.
- Comprobaciones realizadas en esta sesión con asistencia de Codex:
  `npm test` pasó (13 unitarias, 3 de integración y las nueve suites previas);
  TypeScript sin emisión pasó y `npm run build` completó correctamente.
- Experimento, salidas y enlaces:
  [evidence/week08/defecto-controlado.md](week08/defecto-controlado.md).
- Qué demuestra: rechazo de captura inválida en un consumidor real,
  persistencia al reabrir la base y un solo registro al perder una respuesta
  y reintentar con la misma clave. El experimento detectó una
  identidad distinta por envío: fallo remoto 2 != 1 y recuperación confirmada.
  CI: [fallo](https://github.com/xltsignosis/pwa-inspecciones-10B-E04/actions/runs/40038753551)
  y [recuperación](https://github.com/xltsignosis/pwa-inspecciones-10B-E04/actions/runs/40038806892).
- Qué no demuestra y limitación: no valida la interfaz ni recarga real,
  permisos físicos, cuotas de IndexedDB o persistencia remota entre procesos.
  Los E2E y la integración general de CI corresponden al trabajo común del equipo.
- IA: Codex de OpenAI para revisar código, proponer la estrategia, implementar
  las pruebas y ejecutar comprobaciones. Influyó en los archivos listados y
  esta documentación. La validación registrada usa salidas reales y el
  experimento con defecto; cada integrante debe revisar y poder explicar su parte.

# José Ricardo Cruz Aguilar pruebas e2e

Grupo y equipo: 10B - Equipo E04.

Mi contribución de esta semana y enlace: Implementé y ejecuté pruebas de extremo a extremo (E2E) con Playwright. Mi contribución incluye tests/e2e/camera-denied.spec.ts, tests/e2e/home.spec.ts, tests/e2e/inspection-navigation.spec.ts y la configuración tests/e2e/playwright.config.ts. Enlace al commit: pendiente de publicar y obtener el SHA correspondiente.

Decisión técnica y motivo: Utilicé Playwright con Chromium para comprobar comportamientos visibles desde la interfaz. Para probar la denegación de cámara, simulé navigator.mediaDevices.getUserMedia con un rechazo NotAllowedError. Esta decisión permite reproducir el escenario de permisos sin depender de una cámara física ni de la decisión manual del navegador.

c906ae295ca1cfacdc3f185e9faab8663a67d0d4
https://github.com/xltsignosis/pwa-inspecciones-10B-E04/commit/c906ae295ca1cfacdc3f185e9faab8663a67d0d4

Prueba/comando que ejecuté: npx playwright test --config=tests/e2e/playwright.config.ts

Resultado observado y enlace al reporte: La ejecución terminó con 4 pruebas aprobadas y 0 fallidas en 21.7 segundos. También ejecuté individualmente npx playwright test --config=tests/e2e/playwright.config.ts camera-denied.spec.ts, con resultado de 1 prueba aprobada. Las salidas de la terminal constituyen la evidencia local; el enlace al reporte de GitHub se agregará después de publicar los cambios y, si corresponde, generar un reporte accesible.

Qué demuestra y qué no demuestra: Las pruebas comprueban que la pantalla principal muestra las inspecciones, que se pueden verificar los estados de interfaz y el reintento ante un error, y que al denegar el permiso de cámara aparece el mensaje correspondiente y se ofrece la opción de elegir una imagen o continuar sin foto. No demuestran todavía el flujo completo de crear una inspección, guardarla sin conexión, recargar la página y sincronizarla al reconectarse.

Limitación o riesgo: La interfaz revisada todavía no conecta un flujo completo de creación de inspecciones con IndexedDB. Por ello, el flujo E2E de persistencia offline y sincronización queda pendiente de la implementación correspondiente. La prueba de cámara simula el rechazo del permiso; no prueba permisos físicos en un dispositivo real.

IA: herramienta, propósito, partes influidas y validación propia: Utilicé ChatGPT como apoyo para organizar las pruebas E2E, revisar los selectores de la interfaz y preparar los pasos de ejecución. La asistencia influyó en los archivos de pruebas y en la configuración de Playwright. Validé el resultado ejecutando los comandos en mi entorno local y comprobando la salida real de Playwright: 4 pruebas aprobadas en la ejecución completa y 1 prueba aprobada al ejecutar únicamente el caso de cámara denegada.