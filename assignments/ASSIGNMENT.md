# Actividad 5: Persistencia local y sincronización idempotente

## Scenario

La Universidad Tecnológica de Tehuacán necesita una PWA para registrar inspecciones de mantenimiento de laboratorios con datos sintéticos. La conectividad puede ser intermitente y el equipo debe entregar evidencia reproducible.

## Objective

Diseñar consistencia offline-first con cola idempotente, reintentos, resolución de conflictos y prueba de pérdida o duplicación evitada.

## Competencies

**Primaria:** C05. **Acumulativas:** C03, C11.

## Engineering uplift traceability

**Mínimo oficial:** Unidad II: APIs de almacenamiento local, remoto y sincronización de datos.

**Elevación Engineering Target:** Diseñar consistencia offline-first con cola idempotente, reintentos, resolución de conflictos y prueba de pérdida o duplicación evitada.

**Evidencia de la elevación:** Guarda inspecciones localmente, sincroniza al recuperar red, evita duplicados y aplica una política de conflicto explícita. La solución se juzga por comportamiento, decisiones justificadas, pruebas y reproducibilidad, no solo por una demo.

## Prerequisites

Continuar el repositorio personal creado en las semanas anteriores. No descargues un starter nuevo: conserva las rutas, el cache y el manifest, y agrega solo la sincronización de esta semana.

## Schedule and one-week submission window

Semana 5 del calendario de 14 semanas; trabajo individual preferente. Inicio en lunes y entrega a más tardar el domingo de esa misma semana. La duración máxima de la actividad es 7 días y no se aceptan extensiones implícitas de calendario.

## Difficulty

Nivel 8/10. La dificultad proviene de integrar restricciones, justificar trade-offs y demostrar fallos y recuperación, manteniendo un alcance entregable en una semana.

## Requirements

1. Continuar el mismo repositorio de inspecciones e implementar la captura offline indicada.
2. Entregar los archivos indicados y datos exclusivamente sintéticos.
3. Explicar decisiones, límites, riesgos y evidencia de prueba.
4. Ejecutar los comandos de verificación localmente antes de enviar.

**Funcionalidad mínima:** Guarda inspecciones localmente, sincroniza al recuperar red, evita duplicados y aplica una política de conflicto explícita.

**No funcionales:** La operación debe ser idempotente, validada, observable y resistente a reintentos, cierre de pestaña y respuestas fuera de orden.

## Deliverables

- `src/lib/sync/queue.ts`
- `src/lib/storage/schema.ts`
- `src/lib/sync/conflict-policy.ts`
- `docs/sync-policy.md`
- `tests/sync.spec.ts`
- `README.md` con ejecución, supuestos y evidencia.
- Reporte de verificación generado por CI o localmente.

## Repository and reproducibility

El repositorio debe incluir lockfile, configuración de Node declarada y datos sintéticos. Ejecutar `npm ci` y después `make verify` (o documentar el equivalente exacto). No incluir secretos, tokens ni PII.

## Acceptance criteria

- AC-01: el proyecto instala y compila en un entorno limpio.
- AC-02: todos los artefactos específicos de esta actividad existen y son inspeccionables.
- AC-03: las pruebas cubren el comportamiento crítico y fallan ante una regresión relevante.
- AC-04: la decisión técnica y su evidencia son legibles para un evaluador externo.

### Rubric

| Criterion | Evidence | Points |
|---|---|---:|
| AC-01 Reproducibilidad | instalación limpia y build | 2 |
| AC-02 Implementación | artefactos y comportamiento solicitado | 3 |
| AC-03 Calidad verificable | pruebas automatizadas | 2 |
| AC-04 Ingeniería | reporte, trade-offs y límites | 1 |
| **Total** | | **8** |

## Quality gates

- El comando de verificación termina con código 0.
- Las pruebas son deterministas y no dependen de servicios privados.
- Las afirmaciones importantes enlazan requisito, prueba o evidencia.
- No se aceptan secretos, datos reales de estudiantes o resultados generados manualmente sin fuente.

## Individual evidence

Aunque se permite integrar hasta tres personas si existe una razón operativa, la modalidad preferente es individual. Cada estudiante entrega un `evidence/individual.md` con decisiones propias, enlaces a commits relevantes, prueba ejecutada, limitación encontrada y una defensa breve. Los commits o líneas de código no son evidencia única.

## AI policy

Se permite usar IA durante la actividad si se declara herramienta, propósito, fragmentos influenciados y validación humana. La persona estudiante debe poder explicar y modificar su solución. La IA está prohibida en los quizzes presenciales en papel.

## Submission

Abrir un pull request o entregar el commit indicado por el LMS antes del domingo. Adjuntar el reporte de CI, enlace o hash del commit evaluado y `evidence/individual.md`.

## Instructor / evaluator

El evaluador usa el commit fijado, ejecuta el workflow correspondiente y revisa solo la evidencia semiautomática indicada. Si el resultado es incongruente, marca una bandera de revisión; no sustituye el resultado automático por una impresión subjetiva.

## Automation plan

Objetivo de automatización: 90% o más. El workflow instala, compila, ejecuta pruebas públicas y checks privados, y publica `evaluation-result.json`, cobertura y resultados. La revisión manual esperada es 0 puntos y hasta 5 minutos solo para banderas o evidencia individual.

## Public tests

`public-tests/check.sh` verifica existencia de artefactos y una condición mínima reproducible. El estudiante puede ejecutarlo localmente; no contiene la solución ni secretos.

## Hidden tests

`private-evaluator/w05-sync-data/check.sh` y su contrato JSON son solo del instructor. Cubren invariantes, regresiones, seguridad, idempotencia, accesibilidad o trazabilidad que no deben poder ajustarse mirando el caso público.

## Manual review

No hay puntos manuales asignados. Solo se revisan, en un máximo de 5 minutos, las banderas de contradicción entre reporte, implementación y evidencia individual.

## Anti-gaming review

Se controla sobreajuste a nombres de archivos mediante pruebas de comportamiento, casos negativos, revisión del commit fijado y contraste entre evidencia individual y ejecución. No se usa número de commits, líneas de código ni detector de IA como criterio único.

## Score calculation

La actividad aporta 8 puntos de evaluación continua. AC-01 aporta 2, AC-02 aporta 3, AC-03 aporta 2 y AC-04 aporta 1; el resultado automático/semi-automático se escala directamente sobre esos 8 puntos.

## Manual-review flags

Marcar revisión si: el reporte no corresponde al commit; el estudiante no puede explicar una decisión; aparecen secretos o PII; una prueba depende de un servicio no declarado; o el resultado automático contradice una evidencia reproducible.
