# Estrategia de caché — PWA de Inspecciones de Laboratorio

## Qué se precachea

Al instalar el service worker (evento `install`), se guardan en una caché
versionada llamada `inspecciones-precache-v1` los recursos esenciales
para que la app cargue sin conexión:
- `/` (página principal)
- `/manifest.webmanifest`
- `/favicon-192x192.png`
- `/favicon-512x512.png`

Estos archivos no cambian con frecuencia y son necesarios para que la
interfaz básica se muestre incluso sin red.

## Estrategia de runtime cache

Se usan dos estrategias distintas según el tipo de recurso, ambas
guardadas en una caché separada llamada `inspecciones-runtime-v1`:

- **Cache-first** para recursos estáticos (`style`, `script`, `image`,
  `font`): si el recurso ya está en caché, se sirve inmediatamente sin
  tocar la red; si no está, se recurre a network-first como respaldo y
  el resultado se guarda para la próxima vez.
- **Network-first** para navegación (`request.mode === "navigate"`) y
  para el resto de peticiones GET (documentos y datos): se intenta la
  red primero para privilegiar contenido actualizado, y solo se usa la
  caché si la red falla. Esto prioriza que el usuario vea información
  reciente cuando hay conexión, y permite seguir consultando cuando no
  la hay.

Solo se cachean peticiones **GET del mismo origen**; se excluyen
explícitamente mutaciones (POST, PUT, etc.) y peticiones a terceros, para
no cachear información sensible ni operaciones que modifican datos.

## Fallback offline

Si una navegación falla por falta de red y no hay una versión cacheada
de esa ruta específica, el service worker recurre al shell precacheado
(`/`) como página de recuperación. Si tampoco existe eso en caché,
devuelve una respuesta de texto plano con estado 503 ("Sin conexión y
sin contenido disponible"), en vez de dejar que el navegador muestre su
error genérico de conexión.

## Estrategia de actualización

Cada versión del service worker usa nombres de caché versionados con el
sufijo `-v1` (`CACHE_VERSION`). En el evento `activate`, se listan todas
las cachés existentes con el prefijo `inspecciones-` y se eliminan las
que no coincidan con la versión de precache o runtime actual. Esto evita
que coexistan archivos de una versión anterior con los de la versión
nueva, lo que podría causar una mezcla inconsistente (por ejemplo, HTML
nuevo con JS viejo). Al final de `activate`, se llama
`self.clients.claim()` para que el service worker tome control
inmediato de las páginas abiertas.

## Qué NO se cachea

- Peticiones que no sean GET (mutaciones como POST/PUT quedan fuera).
- Peticiones a otros orígenes (terceros).
- Respuestas no exitosas o de tipo `opaque` (no verificables), que se
  descartan antes de guardarse en runtime cache.

Como el producto solo usa datos sintéticos (ver `docs/requirements.md`,
sección 5), no hay información real de personas en riesgo, pero estas
exclusiones documentan el límite como buena práctica para una futura
versión con datos reales.

## Trade-offs y límites

- **Beneficio:** los recursos estáticos (JS, CSS, imágenes) cargan
  instantáneamente en visitas repetidas gracias a cache-first, mientras
  que la navegación y los datos usan network-first para no mostrar
  información desactualizada cuando hay conexión disponible.
- **Costo:** network-first para navegación implica que, con conexión
  lenta, el usuario espera el intento de red antes de recibir contenido,
  incluso si ya existiera una versión en caché más rápida de servir.
- **Límite actual:** si falla el almacenamiento en runtime cache (por
  ejemplo, por cuota del navegador), el contenido igual se entrega al
  usuario; simplemente no queda guardado para la próxima visita. Esta
  semana no se implementa sincronización de datos capturados sin
  conexión (eso corresponde a una semana futura del proyecto).