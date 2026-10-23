# Evidencia individual · semana 8

## Nombre:

- Grupo y equipo:
- Mi contribución de esta semana y enlace:
- Decisión técnica y motivo:
- Prueba/comando que ejecuté:
- Resultado observado y enlace al reporte:
- Qué demuestra y qué no demuestra:
- Limitación o riesgo:
- IA: herramienta, propósito, partes influidas y validación propia; o «no utilicé IA»:

El SHA final común se entrega en Classroom tras el último commit. No inserten ese SHA en un nuevo commit para intentar identificar el mismo archivo.

---

## Arturo Castañeda Serrano · Unitarias, integración y defecto controlado

- Grupo y equipo: equipo de este repositorio; identificación oficial en Classroom.
- Contribución concreta: regla compartida `src/lib/validation/inspection.ts`,
  `tests/unit/`, `tests/integration/`, `tests/fixtures/`, ejecutor
  `scripts/test-layer.mjs` y workflow `week-08-unit-integration.yml`.
  Estrategia: [docs/test-strategy.md](../docs/test-strategy.md).
- Decisión y motivo: conservar la suite anterior y probar resultados reales
  con el ejecutor de Node y fake-indexeddb ya disponibles. El fixture controla
  solo fetch; la validación, cola, serialización y servidor son los de la app.
- Comprobaciones realizadas en esta sesión con asistencia de Codex:
  `npm test` pasó (13 unitarias, 3 de integración y las nueve suites previas);
  TypeScript sin emisión pasó y `npm run build` completó correctamente.
- Experimento, salidas y enlaces:
  [evidence/week08/defecto-controlado.md](week08/defecto-controlado.md).
- Qué demuestra: rechazo de captura inválida en un consumidor real,
  persistencia al reabrir la base y un solo registro al perder una respuesta
  y reintentar con la misma clave. El experimento detectó una
  identidad distinta por envío: fallo remoto 2 != 1 y recuperación confirmada.
  CI: [fallo](https://github.com/xltsignosis/pwa-inspecciones-10B-E04/actions/runs/40038753551)
  y [recuperación](https://github.com/xltsignosis/pwa-inspecciones-10B-E04/actions/runs/40038806892).
- Qué no demuestra y limitación: no valida la interfaz ni recarga real,
  permisos físicos, cuotas de IndexedDB o persistencia remota entre procesos.
  Los E2E y la integración general de CI corresponden al trabajo común del equipo.
- IA: Codex de OpenAI para revisar código, proponer la estrategia, implementar
  las pruebas y ejecutar comprobaciones. Influyó en los archivos listados y
  esta documentación. La validación registrada usa salidas reales y el
  experimento con defecto; cada integrante debe revisar y poder explicar su parte.
