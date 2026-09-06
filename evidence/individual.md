# Evidencia individual del equipo

> Un solo archivo compartido. Repitan la sección siguiente por cada integrante; cada persona escribe y explica su propia evidencia. Se aceptan evidencias previas equivalentes. El SHA final se entrega en Classroom después del último commit, para evitar modificar el commit que se está identificando.

- Grupo y equipo: 10B-E04
- Repositorio del equipo: https://github.com/xltsignosis/pwa-inspecciones-10B-E04

## Integrante: José Ricardo Cruz Aguilar

- Mi contribución concreta y enlace a archivo, commit anterior o revisión:
  Realicé el repositorio del proyecto: Instalé las dependencias con `npm ci`, levanté el entorno de desarrollo con
  `npm run dev` y verifiqué que las tres inspecciones sintéticas se
  mostraran correctamente en http://localhost:3000. También ejecuté la
  prueba proporcionada (`npm test`) y el registro de versiones de entorno
  en el README. Commit:
  https://github.com/xltsignosis/pwa-inspecciones-10B-E04/commit/43c16277525801e06bf6cbe88d4bcd1d2d6ce538

- Decisión que puedo explicar y por qué:
  No se modifico `tsconfig.json` a pesar de que VS Code marca dos advertencias
  de deprecación (`target: es5` y `baseUrl`), porque son opciones que
  dejarán de funcionar hasta TypeScript 7.0, no en la versión actual, y
  el proyecto ya funciona correctamente con ellas. Cambiar la configuración
  base del starter no es parte del alcance de esta semana y podría romper
  la compatibilidad del proyecto con el resto del equipo.

- Comando o prueba proporcionada que ejecuté:
  npm test

- Resultado real que observé:
  El comando ejecutó `tests/starter.spec.mjs`, que revisa tres condiciones:
  que el script "build" en package.json sea "next build", que la página
  principal (src/app/page.tsx) contenga el texto "Inspecciones de
  laboratorio", y que mencione la palabra "sintéticos". Las tres
  condiciones se cumplieron y el resultado fue "starter.spec.mjs: PASS".

- Qué verifica esa prueba y qué no verifica:
  Verifica que el script de build esté configurado correctamente y que
  el contenido textual esperado exista en la página principal. No verifica
  que el proyecto compile sin errores (no ejecuta `next build`), no revisa
  que los datos de las 3 inspecciones se rendericen correctamente en
  pantalla con sus valores reales, y no cubre ninguna funcionalidad futura
  como offline, sincronización o autenticación, ya que esta semana no se
  implementan.

- Limitación, dificultad o riesgo que identifiqué:
  Al ejecutar `npm ci` en PowerShell, el sistema bloqueó la ejecución de
  `npm.ps1` por la política de ejecución de scripts de Windows
  (PSSecurityException). Se resolvió ejecutando
  `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` desde una terminal
  con permisos de administrador. Además, identifiqué que `tsconfig.json`
  usa dos opciones (`target: es5`, `baseUrl`) marcadas como deprecadas por
  TypeScript, que no afectan el funcionamiento actual pero requerirán
  actualización en una futura migración de dependencias.

- Uso de IA: herramienta, propósito, partes influenciadas y validación propia (o «no utilicé IA»):
  Usé Claude (Anthropic) como apoyo para: (1) entender la estructura y el
  alcance de la actividad a partir de los documentos ASSIGNMENT.md y
  ACLARACION.md, (2) diagnosticar y resolver el error de PowerShell durante
  `npm ci`, (3) interpretar el contenido de `tests/starter.spec.mjs` para
  redactar con precisión qué verifica y qué no verifica la prueba
  proporcionada. todos los comandos que se ejecutaron fueron por mí y Sen mi propia
  terminal y validé personalmente cada resultado (instalación exitosa,
  carga correcta de la app en localhost:3000, y el PASS de la prueba)
  antes de documentarlos aquí.

## Integrante: Arturo Castañeda Serrano

- Mi contribución concreta y enlace a archivo, commit anterior o revisión:
  Elaboré y actualicé el análisis de requisitos del producto en
  [`docs/requirements.md`](../docs/requirements.md). Definí el problema y
  contexto, los usuarios y escenarios de uso, los requisitos funcionales
  RF-01 a RF-18, los requisitos no funcionales, los datos sintéticos, los
  límites del producto y los criterios de aceptación de la versión inicial.

- Decisión que puedo explicar y por qué:
  Organicé los requisitos por alcance de versión para distinguir las
  capacidades disponibles en la versión inicial de las que requieren
  desarrollo posterior, como el registro de inspecciones, el trabajo sin
  conexión y la sincronización. Esto evita presentar funciones planeadas
  como si ya estuvieran implementadas.

- Comando o prueba proporcionada que ejecuté:
  `npm run verify`

- Resultado real que observé:
  La comprobación de estructura, la prueba proporcionada y la compilación
  finalizaron correctamente. La prueba mostró `starter.spec.mjs: PASS` y
  Next.js compiló y generó las páginas estáticas sin errores. El reporte
  técnico se generó con estado `pass`; la revisión académica quedó
  pendiente.

- Qué verifica esa prueba y qué no verifica:
  `npm run verify` revisa la estructura requerida, ejecuta la prueba
  proporcionada y realiza la compilación. No evalúa automáticamente la
  calidad, coherencia o suficiencia de los requisitos; el contenido de
  `docs/requirements.md` requiere revisión humana.

- Limitación, dificultad o riesgo que identifiqué:
  Los requisitos de operación sin conexión y sincronización describen una
  capacidad necesaria del producto, pero aún dependen de implementar
  almacenamiento local, control de conflictos y manejo de errores de red.

- Uso de IA:
  Usé Codex (OpenAI) como apoyo para estructurar `docs/requirements.md`. 
  Revisé y adapté el contenido al caso de inspecciones de laboratorios, 
  comprobando que cada requisito tuviera una condición de aceptación observable
  y que se distinguiera el alcance de cada versión del producto.

## Integrante: Ariel Abimael Chacón Herrera

- Mi contribución concreta y enlace a archivo, commit anterior o revisión:
  Redacté `docs/decision-record.md`: la comparación de las cuatro alternativas
  (PWA, web tradicional, app nativa y multiplataforma) en instalación, conexión
  intermitente/offline, distribución, costo de desarrollo, mantenimiento, acceso
  a capacidades del dispositivo y riesgos; la justificación de la estrategia
  PWA + Next.js con las restricciones del equipo 10B-E04; las consecuencias y
  riesgos con sus mitigaciones; y el plan de validación futura. Commit:
  https://github.com/xltsignosis/pwa-inspecciones-10B-E04/commit/72ecf05f87965e560c7ce1cc1091eff862222153

- Decisión que puedo explicar y por qué:
  Recomendé PWA por encima de app nativa aunque la nativa ofrece mejor acceso a
  sensores. El equipo son tres estudiantes en un cuatrimestre que ya trabajan en
  Next.js por el curso; los usuarios son personal interno de la UTT con equipos
  mixtos (PC y móvil) y sin distribución por tiendas; y los requisitos de
  dispositivo del caso —cámara para evidencia (RF-13), almacenamiento local
  (RF-04) y cola de sincronización (RF-05)— están cubiertos por las APIs web
  actuales. Una app nativa añadiría lenguajes y procesos de tienda sin un
  beneficio que el caso necesite ahora.

- Comando o prueba proporcionada que ejecuté:
  `npm ci` y luego `npm run verify` (que ejecuta `npm test` y `next build`), en
  Windows 11 con PowerShell.

- Resultado real que observé:
  `npm ci` instaló 28 paquetes desde el lockfile y advirtió de 2 vulnerabilidades
  de severidad alta en dependencias transitivas del starter. `npm run verify`
  terminó con «Verificación técnica: pass»: la prueba imprimió
  `starter.spec.mjs: PASS` y `next build` (Next.js 14.2.35) compiló y generó 4/4
  páginas estáticas (ruta `/`: 138 B, 87.4 kB First Load JS). Se generó
  `reports/verification.json` con `"status": "pass"`, `"workingTreeClean": true`
  y `runtime.node` `v24.16.0`; la revisión académica quedó como `pending`.

- Qué verifica esa prueba y qué no verifica:
  `npm run verify` comprueba tres cosas: (1) que existan los archivos requeridos,
  (2) que pase `tests/starter.spec.mjs` —que solo revisa que el script `build`
  sea `next build` y que `src/app/page.tsx` contenga los textos «Inspecciones de
  laboratorio» y «sintéticos»— y (3) que `next build` compile. No comprueba que
  las tres inspecciones se rendericen con sus valores en pantalla (eso se ve con
  `npm run dev`), ni la calidad o coherencia del análisis de `docs/requirements.md`
  o `docs/decision-record.md` (requieren revisión humana), ni la ausencia de
  secretos, ni ninguna funcionalidad futura (offline, sincronización,
  autenticación) que esta semana no se implementa.

- Limitación, dificultad o riesgo que identifiqué:
  El reporte local se generó con Node `v24.16.0`, más nuevo que el mínimo 20.19
  declarado y que el `20.19.6` que usa GitHub Actions. El build local pasó, pero
  la versión que se evalúa es la de Actions sobre el SHA final, así que hay que
  confirmar que esa corrida quede verde antes de entregar. Además, `npm ci`
  reportó 2 vulnerabilidades altas en dependencias del starter; no se modificaron
  porque cambiar dependencias está fuera del alcance de esta semana, pero queda
  registrado.

- Uso de IA: herramienta, propósito, partes influenciadas y validación propia:
  Usé Claude (Anthropic) para: (1) contrastar el estado del repositorio contra la
  rúbrica de `ACTIVIDAD-01.md` y `ACLARACION.md`, (2) redactar y estructurar
  `docs/decision-record.md` y esta sección de evidencia, y (3) lanzar e
  interpretar `npm ci` y `npm run verify` en mi equipo. La comparación de
  alternativas y la decisión reflejan el criterio acordado con el equipo. Revisé
  el documento completo y confirmé personalmente el resultado de `npm run verify`
  en mi terminal (`starter.spec.mjs: PASS`, build verde y
  `reports/verification.json` con `status: pass`) antes de dejarlo aquí.

> No necesitan inventar un error ni escribir pruebas nuevas. «Ejecuté npm test» es insuficiente como explicación: indiquen qué observa la prueba y qué comportamiento queda fuera.
