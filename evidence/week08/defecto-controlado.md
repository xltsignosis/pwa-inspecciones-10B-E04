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

Experimento realizado el 23 de octubre de 2026 (Ciudad de México).

| Etapa | SHA y resultado real | CI |
| --- | --- | --- |
| Implementación correcta inicial | `8baa166`: 13 unitarias y 3 de integración pasan, suite previa pasa, tipos y build pasan | Base del experimento |
| Defecto en rama temporal | `d030146f3da99389d94e617a43016ab5c70d952f`: unitarias e integración terminan con código 1 | [Fallo confirmado](https://github.com/xltsignosis/pwa-inspecciones-10B-E04/actions/runs/40038753551) |
| Restauración en rama temporal | `b5c03ab493bd85b2ce1c6c5b1fb7a30547a5c134`: unitarias e integración terminan con código 0 | [Recuperación confirmada](https://github.com/xltsignosis/pwa-inspecciones-10B-E04/actions/runs/40038806892) |

El fallo de integración observado fue `AssertionError`: **2 !== 1**, con el
mensaje «El reintento no debe crear una segunda inspección». La unitaria de
identidad estable también falló porque recibió un UUID distinto del clientId
local. No fue un fallo de instalación: CI instaló bien, fallaron los dos
pasos de pruebas y el paso de conservar artefactos terminó correctamente.

Tras `git revert --no-edit HEAD` en la rama temporal, las 13 unitarias y las
3 de integración volvieron a pasar. Se comprobó que src, tests, scripts y
package.json coincidían con la implementación correcta inicial. La rama
temporal se conserva con ambos commits y su HEAD ya está corregido. No se
fusionó el historial del defecto en `pwa-week-08`; esa rama conserva solo la
implementación correcta y esta evidencia.

### Salidas y modificación exacta

- [Diff del defecto](defecto.patch).
- Fallo: [unitarias](fallo-unit-output.txt), [integración](fallo-integration-output.txt).
- Recuperación: [unitarias](recuperacion-unit-output.txt), [integración](recuperacion-integration-output.txt).
- Metadatos locales con SHA, Node, código de salida y árbol limpio:
  [fallo unitarias](fallo-unit-result.json), [fallo integración](fallo-integration-result.json),
  [recuperación unitarias](recuperacion-unit-result.json), [recuperación integración](recuperacion-integration-result.json).
- Conclusiones, pasos y artefactos consultados en la API de GitHub:
  [fallo](fallo-ci.json), [recuperación](recuperacion-ci.json).

Las dos ejecuciones de Actions conservan el artefacto
`week08-unit-integration-<SHA>` con output.txt, result.json y cobertura LCOV de
ambas capas, incluso en el fallo. La retención depende de GitHub; las copias
anteriores conservan además el resultado local en el repositorio.

### Reproducción del experimento

Con el trabajo propio guardado, se puede inspeccionar cada commit en un
checkout aparte o volver a ejecutar la rama temporal:

```bash
# Consultar la modificación, sin aplicarla:
git show d030146 -- src/lib/sync/queue.ts
# En un checkout desechable del SHA d030146:
npm ci
npm run test:unit
npm run test:integration
# En un checkout del SHA b5c03ab, los mismos comandos deben pasar.
```

Para repetirlo sobre la versión correcta también puede aplicarse
`git apply evidence/week08/defecto.patch` en una rama temporal, ejecutar
**ambas** capas por separado (npm test se detiene en la primera que falla),
y restaurar con `git apply -R evidence/week08/defecto.patch`. No se debe
integrar el parche en la rama del equipo.

La implementación final se entrega desde `pwa-week-08`, con su propio SHA y
[CI de la contribución](https://github.com/xltsignosis/pwa-inspecciones-10B-E04/actions/workflows/week-08-unit-integration.yml?query=branch%3Apwa-week-08).
El SHA final se obtiene después del último commit, no se escribe dentro de
ese mismo commit. La integración del equipo en su versión final sigue su
flujo de revisión habitual.

## Límites

Se rompe deliberadamente la identidad al enviar. No se cambia el esquema
persistente ni se borran datos. El transporte es simulado y usa datos
sintéticos. El defecto debe quedar revertido y no integrarse en la rama del equipo.
