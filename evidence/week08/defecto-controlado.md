# Semana 08: defecto controlado de idempotencia

## Preparación

Rama de trabajo: `pwa-week-08`. Rama temporal: `test/defecto-controlado`.
Antes del experimento deben pasar `npm run test:unit` y
`npm run test:integration`. Ambas se ejecutan también en el workflow
`.github/workflows/week-08-unit-integration.yml`.

## Dónde está la protección

- `src/lib/storage/schema.ts`: IndexedDB usa `keyPath: "clientId"`.
- `src/lib/sync/queue.ts`: enqueue usa put; toOperation conserva clientId;
  createFetchSender lo envía en cuerpo y cabecera Idempotency-Key.
- `src/lib/sync/server-store.ts`: Map por clientId y reconocimiento del mismo
  contenido/versión con duplicate: true.

Quitar solo la condición de duplicado no garantiza dos registros: el Map
sigue teniendo una única entrada por clave. Por eso se altera temporalmente
toOperation para generar otro clientId por envío, en el cuerpo exterior y en
record.clientId. El payload sigue siendo válido, pero el reintento ya no se
reconoce y crea otro registro remoto.

## Escenario

1. Encolar una inspección sintética en IndexedDB aislada.
2. El servidor del fixture guarda el primer envío y pierde su respuesta.
3. La operación queda pendiente y se vuelve a enviar.
4. Esperado correcto: dos envíos iguales, un registro remoto y uno local synced.
5. Esperado con defecto: dos registros remotos y una aserción fallida con salida distinta de cero.

Pruebas: `tests/unit/idempotency.test.ts` (identidad estable) y
`tests/integration/offline-sync.test.ts` (reintento con respuesta perdida).

## Registro de ejecución

Se completará con SHA, salidas reales y enlaces después del experimento.
No se declara un resultado de CI sin consultar su conclusión real.

## Límites

Se rompe deliberadamente la identidad al enviar. No se cambia el esquema
persistente ni se borran datos. El transporte es simulado y usa datos
sintéticos. El defecto debe quedar revertido y no integrarse en la rama del equipo.
