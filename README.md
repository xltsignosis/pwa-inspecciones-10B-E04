# PWA de inspecciones de laboratorio — proyecto del equipo

Comiencen por `START_HERE.md` y lean `ACTIVIDAD-01.md`. Este es un proyecto acumulativo: un repositorio privado por equipo durante el curso. La Semana 1 consiste en arrancar, documentar y explicar la verificación; no en implementar toda la PWA.

## Entorno

Node.js 20.19 o posterior compatible, npm 10 o posterior, Git y cuenta de GitHub. No se requiere Make.

### Versiones utilizadas por el equipo y CI
- **Arturo Castañeda Serrano:** Node `v22.22.2`, npm `10.9.7` (Linux).
- **José Ricardo Cruz Aguilar:** Node `v22.22.2`, npm `10.9.2` (Windows 10 / PowerShell).
- **Ariel Abimael Chacón Herrera:** Node `v24.16.0`, npm `10.9.2` (Windows 11 / PowerShell).
- **GitHub Actions (CI):** Node `v20.19.6`, npm `10.8.2` (Ubuntu Latest).

### Dificultades de entorno y consideraciones
- **Política de ejecución de scripts en PowerShell (Windows):** Al ejecutar `npm ci`, el sistema arrojó `PSSecurityException` al bloquear `npm.ps1`. Se resolvió ejecutando `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` en una terminal con permisos adecuados.
- **Permisos en subprocesos (`spawnSync`):** En entornos locales restringidos, `npm run verify` puede reportar fallos de permisos (`spawnSync npm EPERM`). Se aseguró la ejecución con los permisos correctos sobre el directorio y procesos hijos para validar `npm test` y `next build`.
- **Advertencias de deprecación en `tsconfig.json`:** TypeScript señala opciones deprecadas (`target: es5` y `baseUrl`). Se mantuvieron sin cambios para conservar la integridad del starter oficial de la Semana 1 y evitar discrepancias entre integrantes.
- **Vulnerabilidades en dependencias transitivas:** `npm ci` advierte de 2 vulnerabilidades altas en paquetes del starter. Se decidió no modificar `package.json` ni el lockfile provisto para no alterar el alcance de la entrega.

## Ejecución

```bash
npm ci
npm run dev
```

Abran `http://localhost:3000` y comprueben las tres inspecciones sintéticas. Detengan el servidor con Ctrl+C.

## Verificación

```bash
npm run verify
```

Ejecuta comprobación de archivos, prueba proporcionada y build; genera `reports/verification.json`. El reporte contiene resultados técnicos y documentos para revisión, no una calificación automática. `make verify` es equivalente. `bash public-tests/check.sh` es un check opcional de estructura.

GitHub Actions ejecuta la misma verificación y permite descargar el artefacto `starter-week-01-evidence`. El reporte local se excluye de Git: adjúntenlo en Classroom o descarguen el del SHA entregado desde Actions.

## Trabajo y entrega en equipo

Inviten a los integrantes y al docente al mismo repositorio privado. Cada persona registra su evidencia en una sección de `evidence/individual.md`. Todos entregan en Classroom el mismo SHA final y enlaces, identificando su sección. El formato exacto está en `ACTIVIDAD-01.md`; no se requiere un pull request adicional ni una copia por alumno.

## Estructura y límites

- `src/app/`: pantalla Next.js.
- `src/lib/data/`: inspecciones sintéticas.
- `docs/`: requisitos y decisión del equipo.
- `evidence/`: evidencia propia de cada integrante.
- `tests/`: prueba inicial proporcionada; no es una suite completa de comportamiento.

Registren aquí sus supuestos y limitaciones de ejecución. El starter todavía no implementa instalación PWA, offline ni sincronización. No incluyan datos personales reales en el producto, archivos `.env` ni credenciales. La identificación de integrantes se conserva en el repositorio privado y Classroom.
