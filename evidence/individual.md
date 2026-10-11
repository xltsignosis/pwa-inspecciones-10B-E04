# Evidencia individual — Semana 06: Geolocalización

- Estudiante: Arturo Castañeda Serrano

- Commit SHA evaluado: 402d80914593fe6bf738054890aa902c7c1f8751

- Contribución concreta y archivos relacionados:
  Se implementó `src/lib/device/geolocation.ts` con las funciones
  `isGeolocationSupported()` y `getCurrentLocation()`. El módulo usa
  `navigator.geolocation.getCurrentPosition` y devuelve tres resultados:
  `granted` (concedido, con latitud, longitud y precisión en metros), `denied`
  (denegado) y `unavailable` (no disponible). Los dos últimos incluyen
  `fallback: "manual"` y un mensaje para escribir edificio, zona o referencia.
  Se agregó `tests/geolocation.spec.ts` y se incorporó a `npm test` en
  `package.json`. El alcance acordado fue únicamente el módulo y sus pruebas.

- Decisión técnica que puedo explicar:
  Se eligió una lectura puntual mediante `getCurrentPosition`, sin
  `watchPosition` ni seguimiento en segundo plano. Importar el módulo y
  comprobar soporte no solicita ubicación; `getCurrentLocation()` debe
  invocarse desde una acción del usuario, como pulsar «Usar mi ubicación».
  La solicitud usa `enableHighAccuracy: false`, `timeout: 10000` y
  `maximumAge: 0`: no exige alta precisión, limita la espera y pide una
  lectura sin reutilizar una posición almacenada en caché. Solo devuelve
  coordenadas y precisión; no guarda, envía ni registra esos datos.
  Esto sigue las reglas de `CAMPUSOPS.md`: pedir ubicación solo al usarla y
  permitir captura manual cuando se deniega el permiso o falla la ubicación.

- Prueba que ejecuté y resultado:
  Durante esta sesión, se ejecutó `npx tsx tests/geolocation.spec.ts`:
  `PASS`. Las pruebas usan coordenadas sintéticas y simulan éxito, denegación,
  posición no disponible, timeout, API ausente o incompleta, entorno sin
  `navigator`, excepciones síncronas y respuesta diferida. También comprueban
  que importar el módulo y detectar soporte no solicitan permisos, que cada
  llamada hace una sola lectura y que los fallos no inventan coordenadas.
  `npm test` terminó con las ocho suites en `PASS`.
  `npx tsc --noEmit --incremental false` terminó sin errores de tipos y
  `npm run build` completó la compilación de producción fuera del entorno
  aislado.

- Limitación o fallo diagnosticado:
  El fallback es un contrato del módulo: la interfaz todavía debe ofrecer
  el campo manual, conservar el texto existente y llamar a la función desde
  un botón. Esa integración quedó fuera del alcance solicitado. Las pruebas
  simulan la API; no validan el diálogo de permisos ni la precisión de un
  dispositivo real.

- Cambio que podría defender o modificar en vivo:
  Explicar los tres estados, cambiar el tiempo máximo de espera o la opción
  de alta precisión y ajustar las pruebas correspondientes. Mostrar cómo el
  código de error 1 devuelve `denied`, mientras que posición no disponible y
  timeout devuelven `unavailable`, conservando en ambos casos la alternativa
  manual para continuar.

- Uso declarado de IA (herramienta, propósito, validación):
  Codex de OpenAI se utilizó para el patrón de cámara
  existente, implementar el módulo y escribir pruebas.

---

# Evidencia individual — Semana 06: Notificaciones, pruebas y documento

- Estudiante: Ariel Abimael Chacón Herrera

- Commit SHA evaluado: 1821f656576e6e815f8aaa5d27dd2c4e20e2968c

- Contribución concreta y archivos relacionados:
  Me tocaron las notificaciones, las pruebas y el documento:
  `src/lib/notifications/client.ts` (`isNotificationSupported`,
  `getNotificationPermission`, `describeStatusChange`, `notifyStatusChange`),
  `tests/capabilities.spec.ts` (11 casos sobre cámara, ubicación y
  notificaciones) y `docs/capabilities.md`. En el mismo commit conecté las
  tres capacidades a la interfaz, que no estaba asignado:
  `src/components/inspection-capabilities.tsx` en el detalle de la
  inspección, `notificationclick` en `public/sw.js`, el README de la semana
  y los archivos nuevos en `scripts/verify.mjs` y `npm test`.

- Decisión técnica que puedo explicar:
  El aviso dentro de la app es el canal principal y la notificación del
  sistema es un extra. `notifyStatusChange` devuelve siempre `message`, y el
  panel lo muestra antes de conocer la respuesta al permiso; así, negar el
  permiso o no tener la API no cambia lo que la persona ve en la página. El
  permiso se pide solo dentro del clic que cambia el estado y solo si está
  sin decidir: si ya está denegado no se vuelve a pedir, y si la persona
  cierra el aviso no se insiste hasta recargar. Elegí una notificación local
  (Notifications API) en lugar de push remoto porque un push necesita un
  servidor que guarde suscripciones y claves que el repositorio no debe
  tener; el trade-off es que no avisa con la app cerrada. Uso
  `registration.showNotification()` cuando hay service worker activo porque
  Chrome en Android no permite `new Notification()` desde la página. El
  aviso lleva solo el laboratorio y el estado nuevo, sin responsable ni
  detalle del hallazgo, porque se ve en la pantalla bloqueada.

- Prueba que ejecuté y resultado:
  `npx tsx tests/capabilities.spec.ts`: 11/11 casos `ok`. Cubren que importar
  los módulos no pide permisos, que sin las APIs ninguna función lanza, la
  cámara denegada o con fallo (y que pide solo video y se apaga), la
  ubicación con solo coordenadas y precisión, y en notificaciones el permiso
  denegado, el permiso pedido una sola vez, el aviso cerrado, los datos
  mínimos y el constructor que falla. Para confirmar que detectan
  regresiones alteré el código a propósito tres veces (volver a pedir el
  permiso estando denegado, dejar escapar la excepción del constructor y
  `audio: true` en la cámara): las tres veces la suite falló, y lo restauré.
  `npx tsc --noEmit --incremental false` sin errores. `npm run verify`: las
  9 suites en PASS, `next build` sin errores y reporte `pass`. Con
  `next start` y Chrome sin interfaz revisé el detalle
  `/inspecciones/inspection-001`: al cargar hubo 0 solicitudes de permiso;
  con los permisos negados aparecieron el aviso en la página, "Elegir una
  imagen" y el mensaje de captura manual, conservando el texto que ya estaba
  escrito; con los permisos concedidos y una cámara simulada se mostró la
  notificación, la vista previa de 640x480 y las coordenadas redondeadas.

- Limitación o fallo diagnosticado:
  La notificación es local: no llega con la app cerrada ni a otros
  dispositivos. La foto, la ubicación y el cambio de estado viven en el
  estado de la página y se pierden al recargar; todavía no entran a
  IndexedDB ni a la cola de sincronización de la semana 5. Las pruebas
  simulan `navigator`, `Notification` y `document` en Node, así que no
  validan el diálogo real del navegador. Encontré un fallo al escribirlas:
  `tsc` rechazaba la posición simulada escrita en línea por una propiedad
  que el tipo del navegador no declara, y lo resolví pasándola como
  variable. El caso del aviso cerrado depende de una bandera del módulo y
  por eso va al final de los casos de notificaciones.

- Cambio que podría defender o modificar en vivo:
  Puedo quitar la bandera de "no insistir" y mostrar qué caso falla, cambiar
  el texto o el `tag` del aviso y ajustar su prueba, o mover una llamada a un
  `useEffect` para mostrar cómo la prueba de la interfaz detecta que se pide
  un permiso al cargar. También puedo explicar qué haría falta para un push
  real (suscripción, servidor y evento `push` en el service worker).

- Uso declarado de IA (herramienta, propósito, validación):
  Claude Code como apoyo en implementación, verificación y redacción; revisé y validé los resultados.



# Evidencia individual — Semana 06: Implementacion de permisos de camara

- Estudiante: José Ricardo Cruz Aguilar
- Commit SHA evaluado: 7d820399ddc6b6166bd0a213a4c57357adfcb8e5
- Decisión técnica que puedo explicar:
  Implementé src/lib/device/camera.ts con captureEvidence(), que solo
  abre la cámara cuando el usuario la invoca (nunca al cargar la página)
  y siempre devuelve un resultado controlado: captured, denied o
  unavailable. Usé getUserMedia y no un input de archivo porque permite
  pedir el permiso solo en el momento de la acción. Al dibujar el
  fotograma en un canvas y exportarlo como JPEG, el archivo resultante no
  conserva metadatos EXIF, con lo que se limita lo que se recolecta. El
  bloque finally detiene las pistas de video para que la cámara no quede
  encendida.

- Prueba que ejecuté y resultado:
  Ejecuté npm run build. Resultado: [pega aquí lo que viste, por ejemplo
  "Compiled successfully"]. [Si probaste la captura en el navegador, di
  qué hiciste y qué obtuviste. Si no, escribe que solo verifiqué la
  compilación.]

- Limitación o fallo diagnosticado:
  El build solo comprueba tipos, no el comportamiento de la cámara real.
  Para probar denied y unavailable hacen falta dobles de
  navigator.mediaDevices, que corresponden a tests/capabilities.spec.ts
  de mi compañero. Tampoco pude comprobar en un dispositivo móvil que
  facingMode "environment" use la cámara trasera.
  [Agrega aquí cualquier otro problema real que hayas encontrado.]

- Cambio que podría defender o modificar en vivo:
  Podría explicar por qué se hace stop() sobre las pistas en el finally
  y por qué la función devuelve un tipo unión en lugar de lanzar un
  error. En vivo podría cambiar la calidad de compresión del JPEG o
  agregar un límite de tamaño para la foto.

- Uso declarado de IA (herramienta, propósito, validación):
  Usé Claude (Anthropic) para proponer la estructura de camera.ts y
  revisar el manejo de permisos. Ejecuté yo mismo [los comandos que de
  verdad corriste] y revisé el código antes de subirlo.