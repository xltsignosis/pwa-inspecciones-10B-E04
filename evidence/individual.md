# Evidencia individual — Semana 06: Geolocalización

- Estudiante: Arturo Castañeda Serrano

- Commit SHA evaluado:

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

