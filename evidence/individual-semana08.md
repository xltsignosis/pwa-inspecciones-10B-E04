# Evidencia individual · semana 8

> **Historial de evidencias de semanas anteriores (conservadas en el repositorio):**
> - [Semana 3 — Service Worker y consulta offline](individual-semana03.md)
> - [Semana 4 — Renderizado CSR/SSR con estados verificables](individual-semana04.md)
> - [Semana 5 — Persistencia local y sincronización idempotente](individual-semana05.md)
> - [Semana 6 — Capacidades del dispositivo y notificaciones](individual-semana06.md)
> - [Semana 8 — Evidencia del defecto controlado y recuperación](week08/defecto-controlado.md)

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

---

# Evidencia individual — Semana 08: Estrategia, CI y comandos

- Estudiante: Ariel Abimael Chacón Herrera.
- Grupo y equipo: 10B - Equipo E04.
- Commit de mi contribución: `df0fbaf96ef71215c533aff1b0cca1db14dacb29`.
  [Implementación](https://github.com/xltsignosis/pwa-inspecciones-10B-E04/commit/df0fbaf96ef71215c533aff1b0cca1db14dacb29).

- Contribución concreta y archivos relacionados:
  Mi parte asignada era la estrategia, CI y comandos: `docs/test-strategy.md`,
  `.github/workflows/academic-evaluation.yml`, scripts npm, ejecutor de
  verificación y README. También asumí los bloqueos encontrados: captura
  conectada a IndexedDB desde el inicio (`inspection-capture.tsx`), actualización
  de la lista al guardar/sincronizar, registro y caché del service worker y los
  cinco E2E del flujo común en `tests/e2e/offline-capture.spec.ts`. Conservo las
  unitarias, integración y defecto de Arturo y los cuatro E2E de José.

- Decisión técnica y motivo:
  Reutilizar el esquema, validación, cola y endpoint existentes; la interfaz
  confirma primero la escritura en IndexedDB y solo después intenta enviar.
  Así una desconexión no convierte un guardado local en una pérdida de datos.
  `clientId` se conserva durante los reintentos. La pantalla escucha avisos
  locales después de escrituras confirmadas y vuelve a leer el almacén; no
  mantiene una segunda copia persistente en localStorage. Colocar la captura
  en `/` aprovecha el shell offline y conserva las rutas anteriores.
  `verify` ejecuta todas las capas y las comprobaciones independientes aunque
  otra falle; E2E requiere build aprobado. El código de salida conserva el fallo.

- Comprobaciones ejecutadas con asistencia de Codex y resultado local:
  En Windows/PowerShell, Node `24.16.0`, npm `11.13.0`:
  `npm.cmd ci --no-audit --no-fund` terminó con código 0;
  `npx.cmd playwright install chromium` instaló el navegador;
  `npm.cmd run verify` terminó con código 0: lint sin advertencias, tipos,
  13 unitarias, 3 de integración, las nueve suites previas, build y 9 E2E
  aprobados (14.1 s para E2E). `make verify` invoca el mismo script npm.
  Los reportes locales se generaron con cambios aún sin commit; por eso su
  `workingTreeClean: false` no identifica por sí solo el código ejecutado.

- CI y reportes:
  [Ejecución del commit de implementación](https://github.com/xltsignosis/pwa-inspecciones-10B-E04/actions/runs/40238500004).
  Resultado remoto comprobado: `completed / success`, instalación limpia,
  verificación completa y publicación de artefactos aprobadas en Ubuntu con
  Node `22.22.2`. Artefacto publicado:
  `week08-verification-df0fbaf96ef71215c533aff1b0cca1db14dacb29` (241908 bytes).
  El workflow publica `week08-verification-<SHA>` con reporte global, salidas
  por etapa, cobertura LCOV y reportes HTML/JSON de Playwright. Los artefactos
  tienen retención de 14 días. Preparación y comandos se explican en
  [la estrategia](../docs/test-strategy.md).

- Qué demuestra y qué no demuestra:
  Crear desde el formulario con la red desactivada, recargar conservando
  campos/clientId, reconectar y observar una sola fila sincronizada. También
  completa la captura sin cámara y detecta entradas inválidas. La pérdida
  sintética de respuesta ocurre después del fetch real: el reintento conserva
  el cuerpo y el servidor responde `duplicate: true`. La integración cuenta
  exactamente un registro remoto; el E2E comprueba la fila local y el protocolo
  idempotente. No se sustituyen esas pruebas por búsquedas de texto en el código.

- Limitación o fallo diagnosticado:
  El servidor sigue siendo un Map por proceso; no hay persistencia remota entre
  reinicios ni pantalla para resolver conflictos manualmente. La foto es
  opcional y temporal. Solo se ejecuta Chromium y los permisos se simulan.
  Durante la integración se corrigieron una NodeList incompatible con ES5,
  selectores ambiguos y la espera de scripts `nomodule` que Chromium no carga.
  Se documentan los fallos sin presentarlos como comprobaciones aprobadas.
  Tras publicar, también falló el workflow heredado de semana 01 que invoca
  `verify` sin preparar Chromium. Se corrige esa preparación en un commit
  adicional, conservando los dos commits anteriores y Node 20.19.6. El fallo
  público y el límite de acceso al log se registran en la estrategia.

- Uso declarado de IA y validación humana:
  Codex de OpenAI se utilizó para auditar ramas e historial, implementar la
  captura y pruebas adicionales, configurar comandos/CI, ejecutar verificaciones
  y redactar documentación y evidencia. Influyó en los archivos del commit
  enlazado y en esta sección. Los resultados técnicos descritos proceden de
  ejecuciones reales asistidas; no equivalen a una revisión humana completada.
  Queda pendiente que Ariel revise los cambios, reproduzca una prueba y pueda
  explicar la identidad de reintento y la diferencia entre guardar y sincronizar.
