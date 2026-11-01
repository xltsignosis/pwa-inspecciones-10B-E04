# Semana 09: verificación reproducible

Código evaluado: [`8559c7b55be34160b7a7589a6c919b45116b1814`](https://github.com/xltsignosis/pwa-inspecciones-10B-E04/commit/8559c7b55be34160b7a7589a6c919b45116b1814).
Los resultados locales corresponden a ese commit con árbol limpio; los cambios
posteriores de evidencia no alteran código, pruebas ni configuración.

## Instalación y ejecución local

Windows, Node `v24.16.0`, npm `11.13.0`, Chromium de Playwright.
Comandos efectivamente ejecutados:

```powershell
npm.cmd ci --no-audit --no-fund
npx.cmd playwright install chromium
npm.cmd run verify
node scripts/security-regression.mjs
npm.cmd run verify
```

La instalación añadió 338 paquetes y terminó con código 0. Las opciones
`--no-audit --no-fund` omiten consultas de auditoría y financiación; conservan
la instalación limpia del lockfile. No se afirma haber ejecutado una auditoría
de dependencias. Se observaron avisos de paquetes heredados deprecados.
`make verify` llama exactamente a `npm run verify`; se usó ese equivalente.
La primera verificación fue previa al commit; la segunda genera los resultados
versionados con el SHA de código y árbol limpio.

| Etapa | Resultado local |
|---|---|
| Estructura, lint y tipos | Aprobados, código 0 |
| Unitarias | 13 aprobadas |
| Integración | 3 aprobadas |
| Seguridad | 30 aprobadas |
| Suites heredadas | Las nueve suites aprobadas |
| Build de producción | Aprobado |
| Indicadores de credenciales | Ningún hallazgo en src, public y .next/static |
| Chromium | 12 escenarios aprobados, incluidos 3 nuevos de seguridad |

[Resumen técnico local](verification-local.json): extracción del reporte
`reports/verification.json` conservando SHA, estado del árbol, etapas y códigos
de salida; se omiten únicamente las copias completas de documentos del campo
`academicReview.documents`. Los logs originales por etapa están en [verify/](verify/)
y los de seguridad en [security/](security/).

## Regresión y recuperación

Ejecutar `node scripts/security-regression.mjs` sobre el commit de código.
El defecto cambia `keys.length === fields.length` por `>=`, permitiendo
propiedades adicionales. El script restaura el archivo original incluso si
la ejecución con el defecto lanza un error.

- [Parche temporal](regression/defect.patch).
- [Fallo observado](regression/failure-output.txt): 26 aprobadas y 4 fallidas,
  código 1; se detectan campos extra, símbolos, operaciones y respuestas manipuladas.
- [Recuperación](regression/recovery-output.txt): 30 aprobadas, código 0.
- [Resultado del experimento](regression/experiment.json): SHA de código,
  códigos de salida y comprobación SHA-256 de restauración.

El reporte del fallo indica árbol modificado porque el defecto estaba presente
temporalmente; el de recuperación indica árbol limpio. No se entrega el defecto
como código de la aplicación.

## GitHub Actions

Ejecución del workflow semanal sobre el commit de código:
[Actions 41245486523](https://github.com/xltsignosis/pwa-inspecciones-10B-E04/actions/runs/41245486523).
**Resultado: success**, incluidos instalación limpia, build, AC-02, AC-03,
verificación completa, AC-04 y publicación de artefactos. Su resultado y pasos
se conservan en [ci-code.json](ci-code.json), consultado desde la API de GitHub
una vez terminada la ejecución.

El artefacto `week09-verification-8559c7b55be34160b7a7589a6c919b45116b1814`
contiene el reporte completo, logs, cobertura y resultados de navegador.
La ejecución del commit posterior de evidencias puede localizarse por SHA
en el mismo workflow; el SHA final se entrega con su enlace al terminar.

## Decisiones, supuestos y límites

Las pruebas invocan validadores, endpoint y cola reales; se sustituyen red,
IndexedDB y permisos cuando hace falta aislar fallos con datos sintéticos.
Chromium comprueba cabeceras servidas y bloqueo efectivo de un script sin
nonce; no basta con buscar nombres de directivas en archivos.

El detector de credenciales utiliza patrones limitados y puede omitir formatos
no contemplados. No revisa historial Git ni infraestructura. Las APIs de
cámara y ubicación se simulan, sin fotografías o coordenadas reales; no se
certifican todos los navegadores ni diálogos del dispositivo. El entorno local
es HTTP: comprobar HSTS como cabecera no acredita su aplicación sobre HTTPS.
El endpoint sigue siendo una demostración sin autenticación y con Map temporal.

Estas pruebas y documentos fueron preparados y ejecutados con asistencia de
Codex. La revisión humana y la defensa de la contribución corresponden a Ariel;
no se declaran realizadas por la herramienta.
