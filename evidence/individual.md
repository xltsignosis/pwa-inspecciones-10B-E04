# Evidencia individual

- Estudiante:
- Commit SHA evaluado:
- Decisión técnica que puedo explicar:
- Prueba que ejecuté y resultado:
- Limitación o fallo diagnosticado:
- Cambio que podría defender o modificar en vivo:
- Uso declarado de IA (herramienta, propósito, validación):

# Evidencia individual

- Estudiante: José Ricardo Cruz Aguilar
- Commit SHA evaluado: d037577d3eeedaec85019a98b9720bb5222e9f76
- Decisión técnica que puedo explicar:
  Escribí la prueba de instalabilidad como tests/manifest.spec.ts (no
  .mjs), agregando "tests/**/*.ts" al include de tsconfig.json e
  instalando tsx para poder ejecutarla, porque el evaluador automático de
  esta semana (evaluation.json, criterio AC-02 y AC-03) verifica
  literalmente la existencia de "tests/manifest.spec.ts" y su ejecución
  dentro de "npm test". Inicialmente usé .mjs para evitar errores de
  tipos de Node, pero eso hubiera hecho que el check automático no
  encontrara el archivo esperado.

- Prueba que ejecuté y resultado:
  npm test ejecuta en cadena starter.spec.mjs y manifest.spec.ts. Ambas
  mostraron "PASS". manifest.spec.ts confirma que public/manifest.webmanifest
  existe, es JSON válido, y contiene name, short_name, display: "standalone"
  y al menos 2 iconos. También ejecuté npm run build, que compiló
  exitosamente generando las 4 páginas estáticas del proyecto.

- Limitación o fallo diagnosticado:
  Al crear tests/manifest.spec.ts, TypeScript no reconocía node:assert/strict,
  node:path ni import.meta.dirname, porque el tsconfig.json original solo
  incluía archivos .ts dentro de src/, no de tests/. Lo diagnostiqué
  revisando los errores exactos en VS Code y confirmé la causa comparando
  con tests/starter.spec.mjs, que sí funcionaba por ser JavaScript puro.

- Cambio que podría defender o modificar en vivo:
  Podría explicar por qué agregar "tests/**/*.ts" al include de
  tsconfig.json no afecta el build de producción (ya que next build usa
  su propia configuración de compilación), y podría modificar el manifest
  en vivo para agregar un campo adicional como "scope" si se solicitara.

- Uso declarado de IA (herramienta, propósito, validación):
  Usé Claude (Anthropic) para: (1) generar la estructura inicial de
  manifest.webmanifest y manifest.spec.ts, (2) diagnosticar el error de
  TypeScript en tests/ y decidir la corrección correcta (ajustar tsconfig.json
  en vez de cambiar la extensión del archivo), y (3) redactar esta
  evidencia. Ejecuté personalmente cada comando en mi terminal y confirmé
  los resultados (PASS de ambas pruebas, build exitoso) antes de
  documentarlos.