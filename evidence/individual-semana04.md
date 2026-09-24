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
- Commit SHA evaluado: dae3c160d0500a1730af82d410df28c792da1a8d
- Decisión técnica que puedo explicar:
  Implementé src/app/inspecciones/page.tsx como un Server Component
  asíncrono (sin la directiva "use client"), que obtiene los datos de
  inspecciones y renderiza el HTML completo en el servidor antes de
  enviarlo al navegador (SSR). Para el estado de carga usé el archivo
  especial loading.tsx de Next.js App Router, que el framework muestra
  automáticamente mientras el Server Component resuelve sus datos, en
  vez de manejar el estado de carga manualmente con useState, ya que esa
  opción no está disponible en un Server Component.

- Prueba que ejecuté y resultado:
  Ejecuté npm run build, que compiló exitosamente y generó la ruta
  /inspecciones como contenido estático (○ Static), con un tamaño de
  138 B. También verifiqué manualmente con npm run dev, abriendo
  http://localhost:3000/inspecciones y usando "Ver código fuente de la
  página" (Ctrl+U): confirmé que el HTML crudo enviado por el servidor
  ya contiene el texto completo de las inspecciones (ej. "Laboratorio de
  Redes", "Sin incidencias", "Técnica A"), sin depender de JavaScript del
  cliente para mostrarlo, lo que demuestra que la ruta es SSR real y no
  CSR disfrazado.

- Limitación o fallo diagnosticado:
  Mi archivo dependía de src/components/loading-state.tsx y aún que no estaba
  disponible al momento de desarrollar mi parte, lo que generaba el
  error "Cannot find module '@/components/loading-state'". Lo diagnostiqué
  confirmando que el archivo realmente no existía en el proyecto, y lo
  cree temporalmente en una versión mínima local del componente
  para poder compilar y probar mi código sin bloquearme, sin subir ese
  archivo temporal a Git para no generar conflicto con la versión real
  de mi compañero.

- Cambio que podría defender o modificar en vivo:
  Podría explicar por qué envolví el acceso a los datos sintéticos
  (inspections) dentro de una función async llamada getInspections(),
  aunque el arreglo ya está disponible de forma síncrona: esto deja el
  código preparado para cuando los datos vengan de una fuente realmente
  asíncrona (como una API), sin necesitar refactorizar la estructura de
  manejo de errores (try/catch) que ya está en su lugar. También podría
  modificar en vivo el manejo de errores para diferenciar entre "no hay
  datos" y "falló la carga", que actualmente comparten una lógica similar
  pero podrían requerir mensajes distintos para el usuario.

- Uso declarado de IA (herramienta, propósito, validación):
  Usé Claude (Anthropic) para: (1) generar la estructura inicial de
  page.tsx ajustada a los campos reales de src/lib/data/inspections.ts
  (location, date, inspector, status, statusLabel, findings), (2)
  explicar la diferencia entre Server Components y Client Components en
  Next.js App Router para justificar por qué esta ruta no debía llevar
  "use client", y (3) diseñar la verificación manual de SSR mediante el
  código fuente crudo de la página. Ejecuté personalmente cada comando
  (build, dev) y verifiqué visualmente el resultado en mi propio
  navegador antes de documentarlo aquí.