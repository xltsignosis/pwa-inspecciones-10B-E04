# Evidencia individual — Semana 05

- Estudiante: Arturo Castañeda Serrano

- Commit SHA evaluado:

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
