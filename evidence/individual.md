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

> No necesitan inventar un error ni escribir pruebas nuevas. «Ejecuté npm test» es insuficiente como explicación: indiquen qué observa la prueba y qué comportamiento queda fuera.
