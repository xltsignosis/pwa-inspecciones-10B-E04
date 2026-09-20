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


# Evidencia individual

- Estudiante: José Ricardo Cruz Aguilar
- Commit SHA evaluado: fb6666429b998f7c01d17910d9bb292a2bc90623
- Decisión técnica que puedo explicar:
  Implementé el registro del service worker en un componente cliente
  separado (src/components/service-worker-registrar.tsx) en vez de
  registrar el service worker directamente dentro de layout.tsx, porque
  layout.tsx es un Server Component en Next.js App Router y no puede usar
  hooks como useEffect ni acceder a window/navigator directamente. Separar
  la lógica en un componente con "use client" permite mantener el layout
  como Server Component mientras el registro del service worker se
  ejecuta correctamente en el navegador.

- Prueba que ejecuté y resultado:
  Ejecuté npm run build, que compiló exitosamente incluyendo el nuevo
  componente en el bundle (la ruta / pasó de 138 B a 2.5 kB de tamaño,
  confirmando que ServiceWorkerRegistrar se incluyó). También verifiqué
  manualmente con npm run dev y las DevTools del navegador (pestaña
  Application → Service Workers), confirmando que el service worker de
  mi compañero (public/sw.js) se registra correctamente en el scope
  http://localhost:3000/ y aparece como "activated and is running".

- Limitación o fallo diagnosticado:
  Al escribir el import de mi componente en layout.tsx, el autocompletado
  de VS Code sugirió por error un nombre y ruta distintos
  (ServiceWorkerProvider desde @/app/service-worker-provider, un archivo
  que no existe), generando el error "Cannot find module". Lo diagnostiqué
  comparando el import real en el archivo (con Select-String) contra el
  nombre y ubicación reales de mi componente, y lo corregí escribiendo el
  import completo manualmente en vez de aceptar la sugerencia automática.

- Cambio que podría defender o modificar en vivo:
  Podría explicar por qué el registro ocurre dentro de un
  window.addEventListener("load", ...) en vez de ejecutarse
  inmediatamente: esto evita que el registro del service worker compita
  por recursos con la carga inicial de la página, priorizando que el
  contenido visible cargue primero. También podría modificar el código en
  vivo para, por ejemplo, forzar skipWaiting() ante una actualización
  detectada, explicando el trade-off de hacerlo automático (más agresivo)
  frente a solo notificar (más seguro, lo que implementamos).

- Uso declarado de IA (herramienta, propósito, validación):
  Usé Claude (Anthropic) para: (1) generar la estructura inicial de
  register-service-worker.ts y del componente cliente que lo invoca,
  (2) redactar docs/cache-strategy.md ajustándolo al código real de
  public/sw.js escrito por mi compañero (estrategias cache-first/
  network-first, nombres de caché versionados, fallback offline), y
  (3) diagnosticar el error de import causado por autocompletado. Ejecuté
  personalmente cada comando (build, dev, verificación en DevTools) en mi
  propia terminal y navegador, y confirmé cada resultado antes de
  documentarlo aquí.