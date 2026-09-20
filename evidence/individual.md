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


# Evidencia individual

- Estudiante: Ariel Abimael Chacón Herrera
- Commit SHA evaluado: faf1cda5d71d960f1686a3f87c4c69092caaea5b
- Decisión técnica que puedo explicar:
  Mi parte asignada en el reparto del equipo era Persona 3: escribir
  `tests/service-worker.spec.ts` y `tests/offline.spec.ts`. Al revisar el
  repositorio en `main` encontré que ninguno de los 5 entregables de la
  semana existía todavía, pero que mis compañeros (Arturo y José) ya
  habían resuelto `public/sw.js`, `src/lib/pwa/register-service-worker.ts`
  y `docs/cache-strategy.md` en la rama remota `origin/pwa-semana03`
  (arranca exactamente desde el mismo commit que `main`, sin conflictos).
  Decidí trabajar sobre esa misma rama en vez de sobre `main` para no
  duplicar ni pisar su trabajo, siguiendo el mismo criterio que ya apliqué
  en la Semana 2. Escribí ambas suites en el mismo estilo que el resto de
  `tests/` (`node:assert/strict`, lectura del código fuente como texto,
  sin jsdom/Testing Library ni un runtime de Service Worker real, porque
  no hay ninguna de esas dependencias instaladas): `service-worker.spec.ts`
  verifica que `public/sw.js` declare `CACHE_VERSION` y nombres de caché
  versionados, que registre los 3 eventos del ciclo de vida
  (`install`/`activate`/`fetch`), que `activate` liste y borre cachés
  viejas con `caches.keys()`/`caches.delete(...)`, y que exista una lista
  `PRECACHE_URLS` no vacía que incluya el shell (`/`). `offline.spec.ts`
  verifica que la lógica de `fetch` capture el fallo de red con
  `try`/`catch`, que el `catch` intente `caches.match(...)` (incluyendo el
  shell precacheado `/`) y devuelva una `Response` de reserva con estado
  503 si no hay nada disponible, y que `register-service-worker.ts`
  retorne sin lanzar una excepción cuando `'serviceWorker' in navigator`
  es falso (para no bloquear la carga) y que el registro real encadene un
  `.catch` para errores. También agregué ambas pruebas a la cadena de
  `npm test` en `package.json` (no hay descubrimiento automático de
  specs) y a la lista `required` de `scripts/verify.mjs`, que seguía
  congelada en los artefactos de la Semana 1 y no detectaba si faltaban
  los 5 archivos de esta semana. Actualicé `README.md` para documentar el
  incremento de la Semana 3 sin borrar el historial anterior.

- Prueba que ejecuté y resultado:
  1. `npm ci`: instalación limpia sin errores (31 paquetes).
  2. `npm test`: ejecuta en cadena las 5 pruebas (`starter.spec.mjs`,
     `manifest.spec.ts`, `ui-states.spec.mjs`, `service-worker.spec.ts`,
     `offline.spec.ts`). Las 5 mostraron "PASS".
  3. Prueba de regresión intencional: sustituí temporalmente
     `.map((cacheName) => caches.delete(cacheName))` por un mapeo sin
     borrado en `public/sw.js` y confirmé que `service-worker.spec.ts`
     falla con "activate debe borrar las cachés que ya no correspondan a
     la versión actual"; luego restauré el archivo con
     `git checkout -- public/sw.js` y confirmé que la prueba vuelve a
     pasar. Hice lo mismo eliminando la verificación
     `'serviceWorker' in navigator` de `register-service-worker.ts` y
     confirmé que `offline.spec.ts` falla con el mensaje correspondiente,
     antes de restaurar el archivo. Esto confirma que ambas suites sí
     detectan una regresión real y no son aserciones vacías.
  4. `npm run build`: compilación exitosa en Next.js 14.2.35, generando
     las 4 páginas estáticas del proyecto.
  5. `npm run verify` (equivalente a `make verify`): resultado
     `"status": "pass"` en `reports/verification.json`, con el check de
     estructura reconociendo ahora los 5 artefactos de la Semana 3 sin
     archivos faltantes.
  6. `bash public-tests/check.sh`: imprime `PUBLIC_OK`.

- Limitación o fallo diagnosticado:
  Ambas suites son aserciones estáticas (regex) sobre el texto fuente de
  `public/sw.js` y `register-service-worker.ts`, no un runtime real de
  Service Worker ni una simulación de la Cache API en un navegador; por
  lo tanto no detectan, por ejemplo, que `cache.addAll(PRECACHE_URLS)`
  falle en tiempo de ejecución por una URL rota, ni que el `fetch`
  interceptado realmente sirva el contenido correcto en un navegador.
  Elegí este enfoque porque es determinista, no agrega dependencias (no
  hay Playwright ni un mock de Service Worker instalado) y es consistente
  con el resto de la suite del proyecto — la misma limitación que ya
  documenté para `tests/ui-states.spec.mjs` en la Semana 2. Una mejora
  futura razonable sería una prueba E2E con Playwright que registre el
  service worker real, simule `context.setOffline(true)` y verifique el
  fallback en el navegador. También reconfirmé la limitación ya
  documentada de `public-tests/check.sh` en Windows: `rg` (ripgrep) no
  está instalado en esta máquina, así que la verificación de secretos no
  corre localmente, pero el script igual imprime `PUBLIC_OK` por el mismo
  comportamiento de `set -e` con negación (`!`) en una cadena `&&`; en CI
  (Ubuntu) `rg` sí está disponible y el check corre completo.

- Cambio que podría defender o modificar en vivo:
  Puedo explicar por qué cada assert de `service-worker.spec.ts` y
  `offline.spec.ts` corresponde a un requisito puntual del enunciado
  (ciclo de vida, cachés versionadas, limpieza en activate, fallback
  offline, no bloquear la carga), mostrar en vivo la prueba de regresión
  intencional que hice (romper `activate` o el chequeo de soporte y ver
  fallar la prueba correspondiente), y ubicar exactamente en
  `public/sw.js` y `register-service-worker.ts` el fragmento que cada
  aserción cubre.

- Uso declarado de IA (herramienta, propósito, validación):
  Usé Claude Code (Anthropic) para: (1) diagnosticar el estado real del
  repositorio (ningún entregable de la semana existía en `main`, pero sí
  en la rama remota `origin/pwa-semana03` de mis compañeros) y decidir
  trabajar sobre esa rama en vez de duplicar trabajo, (2) escribir
  `tests/service-worker.spec.ts` y `tests/offline.spec.ts` y las
  actualizaciones de `package.json`, `scripts/verify.mjs` y `README.md`,
  y (3) redactar esta evidencia. Validé personalmente ejecutando
  `npm ci`, `npm test`, `npm run build`, `npm run verify` y
  `public-tests/check.sh`, revisé línea por línea ambas pruebas antes de
  commitearlas, y confirmé manualmente (rompiendo y restaurando el código
  con `git checkout`) que cada prueba efectivamente detecta la regresión
  que dice cubrir.