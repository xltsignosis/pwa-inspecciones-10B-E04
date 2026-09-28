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
- Commit SHA evaluado: 116c55534234cf715df3f584bdc9c724669b7dd6
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

# Evidencia individual

- Estudiante: Ariel Abimael Chacón Herrera
- Commit SHA evaluado: 9b4f809e5dfda1f57adfb55241984144f8ba1c25
- Decisión técnica que puedo explicar:
  Implementé src/app/inspecciones/[id]/page.tsx como Client Component
  ("use client") que obtiene el detalle con fetch dentro de useEffect, ya
  en el navegador (CSR). En vez de importar el arreglo de datos
  sintéticos directamente en la página, agregué un endpoint de solo
  lectura, src/app/api/inspecciones/[id]/route.ts (200 con la inspección
  o 404 si el id no existe). Si la página importara el arreglo, los datos
  quedarían dentro del bundle de JavaScript y los estados de carga y
  error serían simulados; con fetch la carga y el error ocurren de
  verdad (404 o fallo de red). El estado es una unión discriminada
  (loading / not-found / error / ready). Para evitar hydration mismatch
  el estado inicial siempre es "loading", así el HTML del servidor y el
  primer render del cliente son idénticos, y el render no usa window,
  Date.now() ni Math.random(). El efecto usa un AbortController y
  cancela la petición en el cleanup, porque reactStrictMode monta el
  efecto dos veces en desarrollo. Uso LoadingState con la misma API que
  ya usa la ruta SSR (status "loading"/"error" y message), y el botón
  Reintentar y el enlace de regreso van fuera del componente. También
  actualicé README.md con la sección de la Semana 4 (tabla CSR/SSR,
  cómo reproducir cada estado, comparación del HTML crudo, métrica de
  carga, supuestos y límites).

- Prueba que ejecuté y resultado:
  1. npm run build: compila sin errores de tipos. Métrica de carga
     (tabla de rutas de next build):
     /inspecciones (SSR)       ○ Static   140 B    First Load JS 87.4 kB
     /inspecciones/[id] (CSR)  ƒ Dynamic  1.09 kB  First Load JS 88.3 kB
     La ruta CSR envía ~0.95 kB más de JavaScript propio porque incluye
     la lógica de fetch y estados que en SSR se resuelve en el servidor.
  2. npm run start y curl del HTML crudo: /inspecciones ya contiene
     "Laboratorio de Redes" (datos renderizados en servidor);
     /inspecciones/inspection-001 NO contiene ese texto y solo trae el
     estado de carga (role="status"), lo que demuestra que es CSR real.
  3. curl a la API: /api/inspecciones/inspection-001 responde 200 con el
     JSON sintético; /api/inspecciones/no-existe responde 404.
  4. npm test: las 5 suites existentes siguen en PASS.
  5. Prueba en navegador real (Chrome headless controlado por DevTools
     Protocol, contra npm run dev), 6/6 PASS y 0 errores/warnings en
     consola:
     - /inspecciones/inspection-001 pasa de loading al detalle.
     - /inspecciones/no-existe muestra "No existe la inspección
       solicitada." sin botón Reintentar.
     - Con /api/inspecciones/* bloqueado (fallo de red simulado) se
       muestra el error con Reintentar; al desbloquear y pulsar
       Reintentar aparece el detalle.
     - El enlace del listado SSR abre el detalle CSR.
     - La consola no muestra avisos de hydration mismatch.
  6. Regresión intencional: agregué temporalmente {Math.random()} al
     render del estado loading; la prueba del navegador bajó a 5/6 con
     "Text content does not match server-rendered HTML". Restauré el
     archivo con git checkout y volvió a 6/6. La verificación de
     hydration sí detecta el fallo que dice cubrir.

- Limitación o fallo diagnosticado:
  src/components/loading-state.tsx (a cargo de otro integrante) aún no
  estaba en la rama y el build fallaba con "Can't resolve
  '@/components/loading-state'". Para compilar y probar usé una copia
  local mínima con la misma API que ya usa la ruta SSR, sin subirla a
  Git para no generar conflicto con la versión real. Otra limitación:
  en la ruta CSR una inspección inexistente responde HTTP 200 en la
  página (el 404 solo lo ve el fetch de la API), porque el servidor no
  conoce los datos; además el contenido no está en el HTML inicial, lo
  que es peor para SEO y para clientes sin JavaScript que la ruta SSR.

- Cambio que podría defender o modificar en vivo:
  Puedo explicar por qué el estado inicial "loading" evita el hydration
  mismatch, qué pasa si se quita el controller.abort() del cleanup, y
  por qué not-found no muestra Reintentar (repetir un 404 no lo
  arregla) mientras que el error de red sí. También podría convertir la
  ruta a SSR moviendo el fetch a un Server Component y comparar la tabla
  de next build.

- Uso declarado de IA (herramienta, propósito, validación):
  Claude Code como apoyo en implementación, verificación y redacción;
  revisé y validé los resultados.


- Estudiante: Arturo Castañeda Serrano
- Commit SHA evaluado: `b41d1aa2a2d1845661113f00c89941cba7923238`

- Contribución concreta y archivos relacionados:
  Implementé `src/components/loading-state.tsx`, el componente compartido por
  las rutas CSR y de servidor para presentar los estados `loading`, `empty` y
  `error`. También escribí `tests/rendering.spec.ts`, documenté la decisión en
  `docs/rendering-decision.md`, agregué la prueba nueva a la cadena de
  `npm test` en `package.json` y actualicé `scripts/verify.mjs` para exigir los
  artefactos acumulados de la Semana 4.

- Decisión técnica que puedo explicar:
  Mantuve `LoadingState` como un componente sin estado y sin la directiva
  `"use client"`. De esta manera puede utilizarse desde el Server Component del
  listado y desde el Client Component del detalle sin convertir
  innecesariamente la ruta de servidor en código cliente. El componente solo
  presenta información: usa `role="status"`, `aria-live="polite"` y
  `aria-busy="true"` para la carga; `role="status"` para el estado vacío; y
  `role="alert"` con `aria-live="assertive"` para el error. La acción
  **Reintentar** permanece en la ruta CSR, porque esa ruta es la que conoce cómo
  repetir la petición. Para las pruebas combiné renderizado real del componente
  con aserciones sobre los invariantes de las rutas Next.js: separación
  Server/Client Component, estado inicial determinista, `fetch`, 404,
  cancelación con `AbortController` y reintento.

- Prueba que ejecuté y resultado:
  Ejecuté `npm run verify`. La verificación terminó con estado `pass`: las seis
  suites (`starter`, `manifest`, `ui-states`, `service-worker`, `offline` y
  `rendering`) mostraron `PASS`, y `next build` compiló sin errores de tipos.
  El build clasificó `/inspecciones` como contenido estático generado con datos
  en el HTML (140 B y 87.4 kB de First Load JS) y
  `/inspecciones/[id]` como ruta dinámica con interacción cliente (1.38 kB y
  88.6 kB de First Load JS). También ejecuté
  `public-tests/check-semana04.sh`, que terminó con `PUBLIC_OK`, y
  `node scripts/verify.mjs --structure`, que confirmó que todos los artefactos
  requeridos están presentes.

- Limitación o fallo diagnosticado:
  La ejecución directa de las pruebas con `tsx` falló inicialmente en el
  entorno restringido con `listen EPERM` porque el ejecutor intentó crear un
  canal IPC temporal. Confirmé que no era un fallo de la aplicación al repetir
  la suite con los permisos de ejecución adecuados; las seis pruebas pasaron.
  También detecté que importar y renderizar directamente la página de Next.js
  desde `tsx` no reproduce el runtime JSX que inyecta el framework. Para no
  modificar el archivo asignado a otro integrante, la prueba valida los
  invariantes del listado mediante su fuente y deja que `next build` compruebe
  su compilación con el runtime real. Como limitación funcional, el listado usa
  datos locales inmutables y Next.js lo optimiza como `Static`; si los datos
  cambiaran por petición sería necesario definir una política de caché o
  revalidación explícita.

- Cambio que podría defender o modificar en vivo:
  Puedo explicar por qué `LoadingState` no necesita `"use client"`, cambiar sus
  mensajes predeterminados o agregar un estado nuevo manteniendo la semántica
  accesible. También puedo mostrar qué aserción detecta cada regresión: convertir
  el listado en Client Component, quitar el estado inicial `loading`, eliminar
  el manejo de 404, el `AbortController` o el botón de reintento. Puedo volver a
  ejecutar `tests/rendering.spec.ts` y el build para demostrar la diferencia
  entre datos presentes en el HTML inicial y datos solicitados en el cliente.

- Uso declarado de IA (herramienta, propósito, validación):
  Usé Codex (OpenAI) para revisar la consigna, implementar el componente
  compartido,redactar la comparación CSR/SSR. 
  Validé el resultado mediante la prueba nueva, la suite completa, el
  build de producción, la verificación estructural y `npm run verify`. Revisé
  que los cambios se limitaran a los artefactos de la actividad y que las
  métricas documentadas correspondieran al build ejecutado.
