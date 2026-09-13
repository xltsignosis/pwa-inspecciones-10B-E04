# Evidencia individual

- Estudiante: Arturo Castañeda Serrano
- Commit SHA evaluado: 9314050e3962ac00cffa51a6b89e56cb5ac48fb1
- Decisión técnica que puedo explicar:
  Diseñé e implementé el componente `src/components/app-shell.tsx` utilizando landmarks
  HTML5 semánticos (`<header role="banner">`, `<nav aria-label="Navegación principal">`,
  `<main id="main-content" role="main">`, `<footer role="contentinfo">`) y un enlace
  de salto accesible (*skip link*) posicionado fuera de pantalla que se hace visible
  al recibir foco con Tab. Decidí estructurarlo como un componente contenedor modular
  que envuelve a `src/app/page.tsx` en lugar de acoplar la navegación dentro de la página,
  garantizando que la aplicación sea navegable enteramente por teclado y accesible para
  lectores de pantalla. En `src/app/page.tsx`, incorporé la directiva `"use client"` y un
  simulador de estados interactivo para demostrar en vivo los estados de carga (*loading*
  con skeletons accesibles que usan `role="status"` y `aria-busy="true"`), vacío (*empty
  state* con botón de acción) y error de red, preservando rigurosamente las cadenas de texto
  "Inspecciones de laboratorio" y "sintéticos" para evitar regresiones en `starter.spec.mjs`.

- Prueba que ejecuté y resultado:
  1. `npm run build`: Compilación exitosa en Next.js 14.2.35 generando las 4 páginas
     estáticas del proyecto sin errores de tipos TypeScript.
  2. Verificación de AC-02: Comprobación estricta de existencia de los cinco artefactos
     (`public/manifest.webmanifest`, `src/app/layout.tsx`, `src/app/page.tsx`,
     `src/components/app-shell.tsx`, `tests/manifest.spec.ts`), retornando código 0.
  3. `tests/starter.spec.mjs` y `tests/manifest.spec.ts`: Ambas pruebas ejecutadas
     con resultado PASS.
  4. Prueba manual de interfaz y teclado: Comprobación de navegación mediante Tab y Enter
     para activar el skip-link, recorrer los enlaces de navegación y alternar entre los
     estados de carga, vacío y normal en la interfaz.

- Limitación o fallo diagnosticado:
  Diagnostiqué que `public-tests/check.sh` producía un falso positivo (mostraba
  `PUBLIC_OK`) a pesar de que `src/components/app-shell.tsx` no existía. Esto se debía
  a que en Bash bajo `set -e`, un fallo en un comando intermedio de una cadena `&&`
  no detiene la ejecución del script si no es el último comando evaluado, continuando
  hacia las siguientes líneas. En cambio, en GitHub Actions (paso AC-02 de
  `week-02-w02-shell-manifest.yml`), dicha línea se ejecuta como comando único del step,
  por lo que provocaba un fallo con código de salida 1. La resolución consistió en crear
  el componente solicitado y verificar individualmente cada condición.

- Cambio que podría defender o modificar en vivo:
  Puedo explicar la jerarquía de landmarks en `src/components/app-shell.tsx`, cómo opera
  el skip link accesible hacia `#main-content`, cómo se gestiona el foco por teclado con
  `:focus-visible`, y cómo extender los estados de UI en `page.tsx` para conectar la
  lectura asíncrona de IndexedDB o caché de Service Worker cuando se implemente en
  semanas posteriores.

- Uso declarado de IA (herramienta, propósito, validación):
  Usé Antigravity (Google DeepMind) para: (1) diagnosticar el falso positivo de
  `public-tests/check.sh` y la ausencia del componente `app-shell.tsx` exigido por AC-02,
  (2) diseñar la estructura accesible del shell y los skeletons con animación shimmer en CSS,
  y (3) redactar esta evidencia. Validé personalmente el código implementado, ejecuté
  `npm run build` y las pruebas automatizadas, y verifiqué en el navegador el funcionamiento
  de los estados y la navegación por teclado.


# Evidencia individual

- Estudiante: José Ricardo Cruz Aguilar
- Commit SHA evaluado: d037577d3eeedaec85019a98b9720bb5222e9f76
- Decisión técnica que puedo explicar:
  Escribí la prueba de instalabilidad como tests/manifest.spec.ts (no
  .mjs), agregando "tests/**/*.ts" al include de tsconfig.json e
  instalando tsx para poder ejecutarla, porque el evaluador automático de
  esta semana (evaluation.json, criterio AC-02 y AC-03) verifica
  literalmente la existencia de "tests/manifest.spec.ts" y su ejecución
  dentro de "npm test". Inicialmente usé .mjs para evitar errores de
  tipos de Node, pero eso hubiera hecho que el check automático no
  encontrara el archivo esperado.

- Prueba que ejecuté y resultado:
  npm test ejecuta en cadena starter.spec.mjs y manifest.spec.ts. Ambas
  mostraron "PASS". manifest.spec.ts confirma que public/manifest.webmanifest
  existe, es JSON válido, y contiene name, short_name, display: "standalone"
  y al menos 2 iconos. También ejecuté npm run build, que compiló
  exitosamente generando las 4 páginas estáticas del proyecto.

- Limitación o fallo diagnosticado:
  Al crear tests/manifest.spec.ts, TypeScript no reconocía node:assert/strict,
  node:path ni import.meta.dirname, porque el tsconfig.json original solo
  incluía archivos .ts dentro de src/, no de tests/. Lo diagnostiqué
  revisando los errores exactos en VS Code y confirmé la causa comparando
  con tests/starter.spec.mjs, que sí funcionaba por ser JavaScript puro.

- Cambio que podría defender o modificar en vivo:
  Podría explicar por qué agregar "tests/**/*.ts" al include de
  tsconfig.json no afecta el build de producción (ya que next build usa
  su propia configuración de compilación), y podría modificar el manifest
  en vivo para agregar un campo adicional como "scope" si se solicitara.

- Uso declarado de IA (herramienta, propósito, validación):
  Usé Claude (Anthropic) para: (1) generar la estructura inicial de
  manifest.webmanifest y manifest.spec.ts, (2) diagnosticar el error de
  TypeScript en tests/ y decidir la corrección correcta (ajustar tsconfig.json
  en vez de cambiar la extensión del archivo), y (3) redactar esta
  evidencia. Ejecuté personalmente cada comando en mi terminal y confirmé
  los resultados (PASS de ambas pruebas, build exitoso) antes de
  documentarlos.


# Evidencia individual

- Estudiante: Ariel Abimael Chacón Herrera
- Commit SHA evaluado: 61632046c1b4f474194a428ca579361d5fd492a0
- Decisión técnica que puedo explicar:
  Mi parte asignada en el reparto del equipo era el manejo del estado de
  error en la interfaz. Al revisar el repositorio encontré que ese estado
  ya había quedado implementado dentro del commit 9314050 (junto con los
  estados de carga y vacío), y que ningún test cubría el comportamiento de
  esos cuatro estados (`ready`/`loading`/`empty`/`error`) de
  `src/app/page.tsx` — un hueco real frente a AC-03 ("las pruebas cubren
  el comportamiento crítico"). Decidí no tocar `page.tsx` ni
  `app-shell.tsx` para no duplicar ni pisar el trabajo ya commiteado por
  un compañero, y en su lugar escribí `tests/ui-states.spec.mjs`: una
  prueba de aserciones (`node:assert/strict`) sobre el código fuente, en
  el mismo estilo que `tests/starter.spec.mjs` (sin renderizar un DOM),
  para mantener consistencia con la infraestructura de pruebas existente
  y no agregar dependencias nuevas (no hay jsdom ni Testing Library
  instalados). La prueba verifica que existan las cuatro ramas de estado,
  que el estado de carga use `role="status"`/`aria-busy="true"`, que el
  de error use `role="alert"`/`aria-live="assertive"` con una acción de
  reintentar, que el estado vacío ofrezca una acción de recuperación, y
  que el botón "Reintentar consulta" transicione primero a `loading`
  antes de volver a `ready` (en vez de saltar a un estado optimista sin
  retroalimentación). También actualicé `README.md` para documentar el
  incremento de la Semana 2 (shell, manifest, estados) sin borrar el
  historial de la Semana 1, y registré el nuevo script de prueba en
  `package.json`.

- Prueba que ejecuté y resultado:
  1. `npm ci`: instalación limpia sin errores (31 paquetes).
  2. `npm test`: ejecuta en cadena `starter.spec.mjs`, `manifest.spec.ts`
     y `ui-states.spec.mjs`. Las tres mostraron "PASS".
  3. `npm run build`: compilación exitosa en Next.js 14.2.35, generando
     las 4 páginas estáticas del proyecto.
  4. `npm run verify` (equivalente a `make verify`): resultado
     `"status": "pass"` en `reports/verification.json`.
  5. `bash public-tests/check.sh`: imprime `PUBLIC_OK`.

- Limitación o fallo diagnosticado:
  `tests/ui-states.spec.mjs` verifica el comportamiento de los estados
  mediante expresiones regulares sobre el texto fuente de `page.tsx`, no
  renderizando la interfaz en un DOM real ni simulando clics de usuario;
  por lo tanto no detecta regresiones de comportamiento en tiempo de
  ejecución (por ejemplo, un `onClick` que compile pero no dispare el
  cambio de estado real en el navegador). Elegí este enfoque porque es
  determinista, no agrega dependencias y es consistente con el resto de
  la suite, pero una mejora futura razonable sería incorporar jsdom y
  Testing Library para probar la interacción real de los botones. También
  diagnostiqué que `public-tests/check.sh` no puede ejecutar su
  verificación de secretos en Windows local porque `rg` (ripgrep) no está
  instalado en esta máquina — el script igual reporta `PUBLIC_OK` por el
  mismo comportamiento de `set -e` con negación (`!`) que ya documentó un
  compañero; en CI (Ubuntu) `rg` sí está disponible y el check corre
  completo.

- Cambio que podría defender o modificar en vivo:
  Puedo explicar por qué `tests/ui-states.spec.mjs` usa aserciones sobre
  el código fuente en vez de un renderizado real, mostrar cómo extendería
  la prueba a jsdom + Testing Library si se agregara esa dependencia, y
  ubicar en `src/app/page.tsx` exactamente dónde ocurre cada una de las
  cuatro transiciones de estado que la prueba verifica.

- Uso declarado de IA (herramienta, propósito, validación):
  Usé Claude Code (Anthropic) para: (1) diagnosticar el estado real del
  repositorio y determinar qué parte de mi tarea asignada ya estaba
  cubierta por un compañero y qué faltaba genuinamente, (2) escribir
  `tests/ui-states.spec.mjs` y las actualizaciones de `README.md`, y (3)
  redactar esta evidencia. Validé personalmente ejecutando `npm ci`,
  `npm test`, `npm run build`, `npm run verify` y
  `public-tests/check.sh`, y revisé línea por línea el test antes de
  commitearlo.