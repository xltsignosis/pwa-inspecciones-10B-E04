# Evidencia individual — Semana 3

- Estudiante: Arturo Castañeda Serrano
- Commit SHA evaluado: `3cf395035e817c46b536a613cb007b6fb4ef3114`

## Service Worker y consulta offline

- Contribución concreta y archivo relacionado:
  Implementé [`public/sw.js`](../public/sw.js), el Service Worker de la
  aplicación. Incluí el ciclo de vida `install`, `activate` y `fetch`; un
  precache para la página principal, el manifest y los íconos; y dos cachés
  versionadas: `inspecciones-precache-v1` e
  `inspecciones-runtime-v1`.

- Decisión técnica que puedo explicar:
  Decidí no utilizar `skipWaiting()`. De este modo, una versión nueva del
  Service Worker espera a que las pestañas que siguen usando la versión
  anterior se cierren antes de activarse. Al activarse, elimina únicamente
  las cachés cuyo prefijo es `inspecciones-` y que no pertenecen a la versión
  actual; así se evita mezclar recursos de versiones distintas. Para las
  navegaciones y datos `GET` del mismo origen uso una estrategia de red
  primero con recuperación desde caché; para estilos, scripts, imágenes y
  fuentes uso caché primero. Si una navegación falla en red y caché, se
  devuelve el shell precacheado (`/`).

- Verificación realizada y resultado actual:
  Ejecuté `node --check public/sw.js`; la verificación de sintaxis terminó
  sin errores. La comprobación funcional completa aún no procede, porque
  faltan el registro del Service Worker en la aplicación y las pruebas
  específicas de Semana 3. Cuando se integren, ejecutaré `npm test`,
  `npm run build` y una prueba manual: abrir la aplicación una vez con red,
  desactivar la conexión y recargar para comprobar el fallback.

- Qué comprueba esa verificación y qué no comprueba:
  `node --check` confirma que el archivo JavaScript tiene sintaxis válida.
  No registra el Service Worker, no verifica las operaciones de Cache API ni
  demuestra el comportamiento offline en un navegador. Esas condiciones se
  cubrirán con `tests/service-worker.spec.ts`, `tests/offline.spec.ts` y la
  prueba manual de desconexión.

- Limitación o riesgo identificado:
  El Service Worker no puede controlar la aplicación hasta que se cree y use
  `src/lib/pwa/register-service-worker.ts`. También faltan la documentación
  de la estrategia de caché y pruebas automatizadas que protejan contra
  regresiones, por lo que todavía no se debe afirmar que la consulta offline
  está terminada. La caché solo considera peticiones `GET` del mismo origen
  para no almacenar mutaciones, recursos de terceros ni datos potencialmente
  sensibles.

- Cambio que podría defender o modificar en vivo:
  Puedo explicar el propósito de cada evento del ciclo de vida, incrementar
  `CACHE_VERSION` para invalidar una versión anterior y modificar las reglas
  de `fetch` según el tipo de recurso. También podría sustituir el fallback
  al shell por una página offline dedicada si el producto incorpora una.

- Uso declarado de IA (herramienta, propósito, validación):
  Usé Codex (OpenAI) para proponer la estructura inicial de `public/sw.js`,
  incluyendo precache, runtime cache, actualización segura y fallback. Revisé
  el código, adapté la lista de recursos a los archivos reales del proyecto y
  validé su sintaxis con `node --check`. La validación funcional y las pruebas
  de regresión se realizarán cuando estén integrados los artefactos pendientes
  de la Semana 3.
