# Evidencia individual

- Estudiante:
- Commit SHA evaluado:
- Decisión técnica que puedo explicar:
- Prueba que ejecuté y resultado:
- Limitación o fallo diagnosticado:
- Cambio que podría defender o modificar en vivo:
- Uso declarado de IA (herramienta, propósito, validación):

---

## Semana 9: controles de seguridad

- Estudiante: Arturo Castañeda Serrano.
- Grupo y equipo: 10B - Equipo E04.
- Commit SHA evaluado: `9b8c3f208f45cc40a242a9384b8fc991d4445d1e`.

### Contribución y commits

1. [`4adaf3b`](https://github.com/xltsignosis/pwa-inspecciones-10B-E04/commit/4adaf3ba39153c1ef4d1e0e2334ff566c78637a8):
   CSP con nonce aleatorio por respuesta, cabeceras de seguridad, bloqueo de
   variables `NEXT_PUBLIC_*`, reglas para evitar indexación y actualización
   de la caché del service worker a v3. Archivos: `next.config.mjs`,
   `src/middleware.ts`, `src/app/layout.tsx`, `src/lib/security/headers.ts`,
   `src/lib/security/environment.mjs`, `public/robots.txt` y `public/sw.js`.
2. [`1a9ab95`](https://github.com/xltsignosis/pwa-inspecciones-10B-E04/commit/1a9ab95d6868d6418887033aac5e79f3728418fa):
   validación de inspecciones, operaciones y respuestas de sincronización;
   límites de campos del formulario y lectura de JSON limitada a 32 KiB.
   Archivos: `src/lib/security/validation.ts`, `src/lib/security/request.ts`,
   `src/lib/validation/inspection.ts`, `src/lib/sync/queue.ts`,
   `src/lib/sync/server-store.ts`, `src/app/api/inspecciones/sync/route.ts`,
   `src/app/inspecciones/[id]/page.tsx` y `src/components/inspection-capture.tsx`.
3. [`9b8c3f2`](https://github.com/xltsignosis/pwa-inspecciones-10B-E04/commit/9b8c3f208f45cc40a242a9384b8fc991d4445d1e):
   eliminación de `capture="environment"` en el selector alternativo de imagen
   para permitir elegir un archivo sin forzar otra apertura de cámara.
   Archivos: `src/components/inspection-capabilities.tsx` y documentación
   general de los controles en [src/lib/security/README.md](../src/lib/security/README.md).


### Decisión técnica que puedo explicar

La validación se aplica en el formulario, en el servidor y al recibir respuestas
de sincronización. Validar solo en la interfaz permitiría enviar directamente
una operación inválida al endpoint. Las reglas comprueban campos exactos,
tipos, fechas reales, longitudes y coherencia entre la identidad y versión del
sobre y las del registro. Las respuestas inesperadas generan un error antes
de confirmar o sobrescribir información local.

Para la CSP se genera un nonce de 128 bits por respuesta y se comparte con
Next mediante la cabecera de la petición. El layout se renderiza por petición
para que los scripts y la política usen el mismo nonce. El costo de esta
decisión es renunciar al renderizado estático del documento. La configuración
de desarrollo permite `unsafe-eval` para Next; producción no lo incluye.

### Pruebas ejecutadas y resultados

Comprobaciones locales realizadas en Linux, Node `v22.22.2` y npm `10.9.7`, sobre el SHA indicado:

| Comando | Resultado observado |
| --- | --- |
| `npm run lint` | Código 0, sin advertencias. |
| `npm run typecheck` | Código 0, sin errores de tipos. |
| `npm test` | Código 0: 13 pruebas unitarias, 3 de integración y las nueve suites heredadas aprobadas. |

### Limitación o fallo diagnosticado

HSTS requiere HTTPS; `robots.txt` solo solicita no rastrear y no protege el
acceso. El endpoint continúa sin autenticación y almacena datos sintéticos en
memoria por proceso.

### Cambio que podría defender o modificar en vivo

Explicar y ajustar el máximo de hallazgos, actualmente 10000, tanto en
`src/lib/security/validation.ts` como en el campo del formulario, y demostrar
que una entrada fuera del límite también se rechaza al enviarla al servidor.
También explicar por qué el límite de 32 KiB cuenta bytes recibidos aunque
falte `Content-Length`, y por qué la alternativa de galería omite `capture`.

### Uso declarado de IA

Codex de OpenAI asistió en la implementación documentada, la revisión de cambios la ejecución
de comprobaciones. Su influencia comprende los archivos listados y esta evidencia. 
Los resultados descritos proceden de ejecuciones reales asistidas. 
