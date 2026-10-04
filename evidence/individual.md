# Evidencia individual — Semana 05

- Estudiante: Arturo Castañeda Serrano

- Commit SHA evaluado: 8aed7b23c053910a45c7e444939ce84c96371ba7

- Contribución concreta y archivos relacionados:
  Implementé `src/lib/storage/schema.ts`, que extiende el tipo `Inspection`
  existente mediante el tipo `StoredInspection`. El nuevo tipo agrega
  `clientId` como identificador idempotente generado en el dispositivo,
  `syncStatus` con los estados `pending`, `synced` y `conflict`, una versión
  numérica y la fecha ISO `updatedAt`. También agregué la función
  `createStoredInspection` para preparar una inspección antes de almacenarla y
  `openInspectionDatabase` para crear o abrir la base local en IndexedDB.

- Decisión técnica que puedo explicar:
  Elegí la API nativa de IndexedDB para evitar agregar una dependencia solo
  para definir un almacén sencillo. La base utiliza `clientId` como `keyPath`
  porque ese valor se genera una sola vez con `crypto.randomUUID()` y debe
  conservarse durante todos los reintentos; así, la capa de sincronización
  puede enviar siempre la misma clave y el servidor puede reconocer la misma
  operación sin crear duplicados. Agregué índices no únicos por `id`,
  `syncStatus` y `updatedAt`: el primero permite localizar una inspección del
  dominio, el segundo obtener rápidamente la cola pendiente y el tercero ayuda
  a ordenar o comparar cambios. La función de apertura también cierra la
  conexión cuando detecta un cambio de versión, para no bloquear futuras
  migraciones del esquema.

- Prueba que ejecuté y resultado:
  Ejecuté `npx tsc --noEmit` y el archivo compiló sin errores de tipos. Después
  ejecuté `npm test`: las seis pruebas existentes (`starter`, `manifest`,
  `ui-states`, `service-worker`, `offline` y `rendering`) terminaron en
  `PASS`. Finalmente ejecuté `npm run build`; Next.js completó la compilación
  de producción, la revisión de tipos y la generación de las cinco páginas sin
  errores.

- Limitación o fallo diagnosticado:
  IndexedDB solo está disponible en el navegador, por lo que
  `openInspectionDatabase` no puede utilizarse durante el renderizado del
  servidor. Agregué una validación que devuelve un error explícito cuando la
  API no existe, en lugar de provocar un fallo ambiguo. Además, las pruebas
  actuales confirman que no se rompió el proyecto, pero todavía no simulan una
  base IndexedDB ni comprueban la creación de sus índices al integrar la cola de sincronización.

- Cambio que podría defender o modificar en vivo:
  Puedo explicar la diferencia entre el `id` de la inspección y el `clientId`
  idempotente, crear una inspección pendiente con `createStoredInspection`,
  mostrar cómo se construye el almacén y sus índices durante
  `onupgradeneeded`, o incrementar `INSPECTIONS_DB_VERSION` y agregar una
  migración. También podría cambiar la clave o los índices y explicar cómo esa
  modificación afectaría la cola, los reintentos y la detección de conflictos.

- Uso declarado de IA (herramienta, propósito, validación):
  Usé Codex de OpenAI para revisar la consigna y como ayuda para saber como 
  implementar el esquema con la API nativa de IndexedDB. Revisé personalmente el
  tipo `Inspection` existente y validé el resultado mediante la comprobación
  de TypeScript, las seis pruebas del proyecto y el build de producción.

---

# Evidencia individual — Semana 05

- Estudiante: Ariel Abimael Chacón Herrera

- Commit SHA evaluado: f58c4201d748becac508dc4b4ed50010fbe9f9cc

- Contribución concreta y archivos relacionados:
  Me tocó la política de conflictos, las pruebas y el documento de
  sincronización: `src/lib/sync/conflict-policy.ts` (`resolveConflict`,
  `resolveManually`, `isStaleAck`, `hasSameContent`), `tests/sync.spec.ts`
  (9 casos) y `docs/sync-policy.md`.

- Decisión técnica que puedo explicar:
  Elegí "base común + decisión manual" en lugar de "el más reciente gana".
  Cada registro recuerda `baseVersion`, la última versión que confirmó el
  servidor. Si solo cambió el dispositivo se conserva la copia local, si solo
  cambió el servidor se adopta la remota, y si cambiaron ambos el registro
  queda en `conflict` con las dos copias (`remoteCopy`) hasta que una persona
  elige. Descarté last-write-wins porque `updatedAt` depende del reloj de cada
  dispositivo y podría borrar un hallazgo de inspección sin avisar. Una prueba
  lo demuestra: una copia remota con fecha de 2030 no gana en silencio. El
  trade-off es que dos ediciones concurrentes requieren intervención manual.
  También uso `isStaleAck` para que una confirmación de una versión vieja (una
  respuesta fuera de orden) no marque como sincronizada una edición más nueva.

- Prueba que ejecuté y resultado:
  `npx tsx tests/sync.spec.ts`: 9/9 casos `ok`. Cubren la idempotencia (la
  misma clave enviada dos veces, y la respuesta perdida tras un timeout), la
  operación sin red que permanece en la cola, el conflicto local + remoto, la
  cola que sobrevive al reabrir IndexedDB, la respuesta vieja que llega tarde,
  las respuestas en desorden y los payloads inválidos. Usan `fake-indexeddb` y
  un servidor sintético en memoria. Para confirmar que detectan regresiones
  quité a propósito la comprobación `isStaleAck` y la regla de duplicado del
  servidor: en ambos casos la suite falló con `AssertionError`, y la restauré.
  `npm run verify`: las 7 suites en PASS, `next build` sin errores y reporte
  `pass`. Con `next start` y `curl` a `POST /api/inspecciones/sync`, el mismo
  envío dos veces dio 200 y luego 200 con `duplicate: true`; un contenido
  distinto sobre la misma versión dio 409 con la copia remota, y un payload
  inválido dio 400.

- Limitación o fallo diagnosticado:
  Un registro en `conflict` no se reintenta solo. No se pierde, pero tampoco
  llega al servidor hasta que alguien llama a `resolveManually`, y la interfaz
  todavía no tiene la pantalla para hacerlo. Además, `fake-indexeddb` reproduce
  la API pero no las cuotas ni el desalojo de almacenamiento de un navegador
  real, y el servidor de pruebas vive en memoria.

- Cambio que podría defender o modificar en vivo:
  Puedo cambiar la política a last-write-wins comparando `updatedAt`, y mostrar
  qué prueba falla y por qué se pierde un dato. También puedo agregar una
  mezcla campo por campo cuando los cambios no se tocan entre sí, o explicar
  con el caso de la respuesta tardía qué pasaría sin `isStaleAck`.

- Uso declarado de IA (herramienta, propósito, validación):
  Claude Code como apoyo en implementación, verificación y redacción; revisé y validé los resultados.


# Evidencia individual

- Estudiante: José Ricardo Cruz Aguilar
- Commit SHA evaluado: acf34ee8bb192d4d07caba01c574e9de8825c085
- Decisión técnica que puedo explicar:
  Implementé la cola de sincronización (src/lib/sync/queue.ts) reutilizando
  directamente el object store de IndexedDB definido en
  src/lib/storage/schema.ts, en vez de crear una cola independiente en
  localStorage. Como clientId es la keyPath del object store, llamar a
  enqueue() dos veces con la misma inspección (mismo clientId) sobrescribe
  el registro existente en vez de insertarlo duplicado, lo que me dio
  idempotencia de forma estructural sin tener que implementar una
  verificación manual de duplicados.

- Prueba que ejecuté y resultado:
  Ejecuté npm run build, que compiló exitosamente sin errores de tipos,
  confirmando que StoredInspection y los índices definidos en schema.ts
  (by-sync-status) se integran correctamente con las funciones enqueue,
  getPending, markSynced y markConflict de mi módulo.

- Limitación o fallo diagnosticado:
  markSynced() y markConflict() usan dos transacciones separadas (una
  lectura con get() y, dentro de su callback, una escritura con put()) en
  vez de hacerlo todo en una sola transacción atómica. Esto es una
  limitación conocida: en un escenario con alta concurrencia (varias
  pestañas escribiendo al mismo tiempo) podría existir una ventana breve
  entre leer y escribir. Para el alcance de esta actividad, con un único
  cliente operando la cola, no representa un riesgo real, pero lo dejo
  documentado como mejora pendiente.

- Cambio que podría defender o modificar en vivo:
  Podría explicar por qué markSynced solo debe llamarse tras una
  confirmación real del servidor y nunca ante un timeout, ya que un
  timeout no prueba que el servidor no haya procesado la operación. En
  vivo, también podría modificar getPending para aceptar un límite de
  resultados, útil si la cola crece mucho en un dispositivo con
  conectividad muy intermitente.

 - Uso declarado de IA (herramienta, propósito, validación):
   Usé Claude (Anthropic) para: (1) diseñar queue.ts aprovechando la
   estructura real de IndexedDB ya implementada por mi compañero en
   schema.ts, en vez de proponer un almacenamiento paralelo en
   localStorage, y (2) redactar la documentación de por qué markSynced no
   debe dispararse ante un simple fallo de red. Ejecuté personalmente
   npm run build en mi terminal y confirmé que compilara sin errores antes
   de documentar el resultado aquí.