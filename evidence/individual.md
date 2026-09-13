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