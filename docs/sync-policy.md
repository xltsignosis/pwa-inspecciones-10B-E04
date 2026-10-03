# Política de sincronización y conflictos — Semana 5

Este documento explica cómo la PWA guarda inspecciones sin conexión, cómo las envía al recuperar la red sin duplicarlas y qué pasa cuando el mismo registro cambió en el dispositivo y en el servidor. Todos los datos son sintéticos.

## Piezas

| Archivo | Responsabilidad |
|---|---|
| `src/lib/storage/schema.ts` | Tipo `StoredInspection` (`clientId`, `syncStatus`, `version`, `updatedAt`, `baseVersion`, `remoteCopy`) y apertura de IndexedDB con `clientId` como `keyPath`. |
| `src/lib/sync/queue.ts` | Cola persistente: `enqueue`, `saveLocalEdit`, `getPending`, `markSynced`, `markConflict`, `syncPending` y `startAutoSync`. |
| `src/lib/sync/conflict-policy.ts` | Funciones puras: `resolveConflict`, `resolveManually`, `isStaleAck`, `hasSameContent`. |
| `src/lib/sync/server-store.ts` + `src/app/api/inspecciones/sync/route.ts` | Servidor sintético en memoria (`POST /api/inspecciones/sync`) que valida y deduplica por `clientId`. |
| `tests/sync.spec.ts` | 9 casos sobre IndexedDB en memoria (`fake-indexeddb`) y el servidor sintético. |

## Ciclo de un registro

```
captura → pending ──envío ok──────────────→ synced
            │  ▲                              │ edición local
            │  └── sin red / timeout ─────────┤ (version + 1)
            │      (sigue pending)            ▼
            └──409 y ambos cambiaron──→ conflict ──decisión de la persona──→ pending / synced
```

## Política de conflicto elegida: base común + decisión manual

Cada registro recuerda `baseVersion`, la última versión que el servidor confirmó. Cuando el servidor responde `409` con su copia, `resolveConflict(local, remota)` compara las dos contra esa base:

| Situación | Resultado | Qué se guarda |
|---|---|---|
| Mismo contenido de negocio | `unchanged` | Se marca `synced` con la versión remota. |
| Solo cambió el dispositivo (`remota.version <= base`) | `keep-local` | Copia local, `pending`, con base actualizada; se reenvía en el siguiente intento. |
| Solo cambió el servidor (la local no tenía cambios pendientes) | `take-remote` | Copia remota, `synced`. |
| Cambiaron ambos | `conflict` | Copia local intacta + `remoteCopy` con la remota. No se reenvía sola. |

Un registro en `conflict` se resuelve con `resolveManually(registro, "local" | "remote")`. Si se elige la local, se crea una versión nueva encima de la remota (`version = max + 1`, `baseVersion = remota.version`) y el servidor la acepta. Si se elige la remota, queda `synced` sin volver a enviarse.

**Por qué no "el más reciente gana" (last-write-wins).** `updatedAt` sale del reloj de cada dispositivo, y en una tableta de laboratorio ese reloj puede estar adelantado o atrasado. Con LWW, una edición podría borrar otra sin que nadie se entere. En una inspección de mantenimiento, perder un hallazgo es peor que pedirle a la persona que elija. El caso de prueba de la política lo comprueba: aunque la copia remota tenga una fecha de 2030, no gana en silencio.

**Trade-off aceptado.** Si dos personas editan el mismo registro sin conexión, alguien tiene que decidir a mano. La política no hace una mezcla campo por campo; eso queda como mejora futura.

## Idempotencia

- `clientId` se genera una sola vez con `crypto.randomUUID()` (`createClientId`) y no cambia en ningún reintento.
- **En el dispositivo:** `clientId` es la `keyPath` del object store, así que `enqueue` usa `put` y volver a encolar el mismo registro lo sobrescribe en lugar de duplicarlo.
- **En el envío:** cada operación lleva `clientId`, `version` y `baseVersion`. `createFetchSender` además manda el encabezado `Idempotency-Key: <clientId>`.
- **En el servidor** (`server-store.ts`):
  1. El mismo `clientId`, la misma `version` y el mismo contenido son un reintento: responde `200` con `duplicate: true` y no guarda nada nuevo.
  2. Si `baseVersion` coincide con la versión guardada, o el registro es nuevo, la acepta (`200`).
  3. En cualquier otro caso responde `409` con la copia del servidor.
  4. Un payload mal formado responde `400` y no toca el almacén.
- **Timeout ≠ fallo.** Si la respuesta se pierde después de que el servidor guardó, el registro sigue `pending`. El reintento llega con el mismo `clientId` y la misma versión, cae en la regla 1 y no se duplica. Esto está probado en "si la respuesta se pierde, el reintento no crea otro registro".

## Reintentos y respuestas fuera de orden

- `syncPending(send)` lee los pendientes desde IndexedDB y los envía en paralelo. Un error de red, un timeout (10 s con `AbortController`) o una respuesta que no es 2xx/409 deja el registro tal como estaba.
- Si se llama `syncPending` mientras ya hay una ronda en curso, devuelve esa misma ronda. Así no viajan dos veces las mismas versiones en paralelo.
- `startAutoSync` (montado en `layout.tsx` mediante `SyncRegistrar`) sincroniza al cargar y en cada evento `online`. Si quedan registros sin confirmar, reintenta con espera exponencial de 5 s, 10 s, 20 s… hasta un máximo de 5 min.
- **Fuera de orden.** Cada respuesta se aplica por `clientId` y por la versión que confirma, nunca "a la última operación enviada". `markSynced(clientId, versiónConfirmada)` hace la lectura, la comparación y la escritura en una sola transacción. Si el registro ya tiene una versión mayor (`isStaleAck`), porque se editó mientras viajaba la anterior, **no** se marca `synced`: solo se actualiza `baseVersion` y la versión nueva se envía en la siguiente ronda.

## Garantía de no pérdida de datos

1. Toda captura o edición se escribe primero en IndexedDB (`enqueue` / `saveLocalEdit`), antes de cualquier intento de red. Cerrar la pestaña no pierde nada, porque la cola no vive en memoria y se relee de la base al volver.
2. Un registro solo deja de estar `pending` cuando hay una confirmación explícita del servidor para **su** versión actual. Ni un error ni un timeout lo sacan de la cola.
3. Una confirmación vieja no puede ocultar una edición más nueva (`isStaleAck`).
4. En un conflicto se guardan las dos copias (`remoteCopy`) y el servidor no se sobrescribe hasta que la persona decide.

## Observabilidad

`syncPending` devuelve `{ attempted, synced, conflicts, failed, requeued }` y `startAutoSync` lo escribe con `console.info("[sync] resultado", …)`. El estado de cada registro (`pending` / `synced` / `conflict`) se puede inspeccionar en DevTools → Application → IndexedDB → `laboratory-inspections`.

## Evidencia (tests/sync.spec.ts)

| Requisito | Caso |
|---|---|
| Misma clave enviada 2 veces no duplica | "la misma clave de idempotencia enviada dos veces no duplica"; "si la respuesta se pierde, el reintento no crea otro registro" |
| Fallo sin red permanece en cola | "una operación fallida por falta de red permanece en la cola" |
| Conflicto local + remoto | "cambio local y remoto simultáneo queda en conflicto sin perder ninguna copia"; "la política distingue cambio solo local, solo remoto y contenido igual" |
| Cola sobrevive a reiniciar | "la cola sobrevive a cerrar la pestaña (se relee desde IndexedDB)" |
| Respuestas fuera de orden | "una respuesta vieja que llega tarde no marca como sincronizada una edición nueva"; "respuestas en orden distinto al envío se aplican a su propio registro" |
| Validación | "el servidor rechaza operaciones inválidas sin guardarlas" |

Las pruebas detectan regresiones. Si se quita la comprobación `isStaleAck` en `markSynced`, falla el caso de respuesta vieja. Si se quita la regla de duplicado del servidor, falla el caso de idempotencia.

## Supuestos y límites

- El servidor es un `Map` en memoria dentro del proceso de Next.js: se vacía al reiniciar `npm run dev` / `npm run start` y no se comparte entre instancias. Sirve para demostrar el protocolo, no para persistir.
- La interfaz no tiene todavía un formulario de captura ni una pantalla para resolver conflictos. La cola se llena con `enqueue` / `saveLocalEdit`, y `resolveManually` está listo para conectarse a esa pantalla.
- `fake-indexeddb` reproduce la API de IndexedDB en Node, pero no los límites de cuota ni el desalojo de almacenamiento de un navegador real.
- Un registro en `conflict` no se reintenta solo. Si nadie lo resuelve, se queda en el dispositivo (no se pierde, pero tampoco llega al servidor).
- Borrar inspecciones no forma parte de esta semana.
