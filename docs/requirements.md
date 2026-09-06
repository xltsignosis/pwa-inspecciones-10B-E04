# Requisitos del producto

## 1. Problema y contexto

El personal encargado del mantenimiento de los laboratorios necesita registrar inspecciones y dar seguimiento a los hallazgos detectados. Actualmente, una revisión realizada durante una falla de red puede quedar sin registrar o requerir notas separadas, lo que dificulta consultar su estado y atenderla oportunamente.

El producto es una aplicación para consultar y capturar inspecciones de mantenimiento de laboratorios de la UTT, incluso cuando la conexión sea intermitente. Permitirá conservar temporalmente los registros creados sin conexión y enviarlos cuando esta vuelva a estar disponible.

La versión inicial del producto muestra tres inspecciones sintéticas para ilustrar la consulta. La captura de inspecciones, el almacenamiento local, la sincronización, autenticación, notificaciones y asignación de responsables se incorporarán de forma gradual en versiones posteriores. El producto no utilizará datos reales durante su etapa de demostración.

## 2. Usuarios y escenarios

**Usuarios principales.** Personal técnico o encargado de inspeccionar laboratorios y responsable de mantenimiento que consulta los hallazgos para priorizar su atención.

### Escenario 1: consulta con conexión disponible

Situación inicial: una persona responsable abre la aplicación desde una computadora con conexión para revisar el estado reciente de los laboratorios.

Acción: consulta el listado de inspecciones e identifica el registro del laboratorio que requiere atención.

Resultado esperado: puede ver la ubicación, fecha, persona responsable, estado, número de hallazgos y resumen de cada inspección, para decidir cuál debe atenderse primero.

### Escenario 2: registro con conexión intermitente

Situación inicial: una persona técnica detecta un desperfecto durante una inspección y en ese momento no tiene conexión estable.

Acción: captura el laboratorio, la fecha y el hallazgo en la aplicación.

Resultado esperado: el registro se conserva localmente sin perderse; al recuperar conexión, queda disponible para sincronizarse y posteriormente consultarse por el responsable de mantenimiento.

## 3. Requisitos funcionales

| ID | Acción del producto | Condición observable de aceptación | Alcance de versión |
|---|---|---|---|
| RF-01 | Mostrar el listado inicial de inspecciones sintéticas. | Al abrir la página principal se muestran tres tarjetas de inspección con ubicación, fecha, responsable, estado, hallazgos y resumen. | Versión inicial |
| RF-02 | Consultar el estado de una inspección. | Una persona puede identificar visualmente si cada inspección está «Sin incidencias» o «Requiere atención» y cuántos hallazgos contiene. | Versión inicial |
| RF-03 | Registrar una nueva inspección. | Al guardar datos válidos de laboratorio, fecha, responsable, estado y hallazgo, aparece un nuevo registro con esos mismos valores. | Versión posterior |
| RF-04 | Conservar un registro creado sin conexión. | Al registrar una inspección sin conexión, el sistema informa que fue guardada localmente y el registro permanece disponible al cerrar y volver a abrir la aplicación en el mismo dispositivo. | Versión posterior |
| RF-05 | Sincronizar registros pendientes. | Cuando vuelve la conexión, los registros locales pendientes se envían una sola vez y muestran un estado de sincronización exitoso o un error recuperable. | Versión posterior |
| RF-06 | Consultar hallazgos que requieren atención. | El responsable puede distinguir o filtrar los registros con estado «Requiere atención» para darles seguimiento. | Versión posterior |
| RF-07 | Consultar el detalle de una inspección. | Al seleccionar una inspección, se muestra su ubicación, fecha, responsable, estado, hallazgos y descripción completa. | Versión posterior |
| RF-08 | Editar una inspección pendiente. | Una persona autorizada puede cambiar los datos de una inspección y, al guardar, la consulta muestra la información actualizada. | Versión posterior |
| RF-09 | Marcar un hallazgo como atendido. | Al registrar que un hallazgo fue resuelto, su estado cambia a atendido y se conserva la fecha de actualización. | Versión posterior |
| RF-10 | Buscar inspecciones por laboratorio. | Al escribir el nombre o parte del nombre de un laboratorio, la lista muestra únicamente las inspecciones coincidentes. | Versión posterior |
| RF-11 | Filtrar inspecciones por estado. | La persona usuaria puede mostrar solo inspecciones sin incidencias, con atención requerida o atendidas. | Versión posterior |
| RF-12 | Filtrar inspecciones por periodo. | Al elegir una fecha inicial y una final válidas, se muestran únicamente las inspecciones registradas dentro de ese periodo. | Versión posterior |
| RF-13 | Adjuntar evidencia de un hallazgo. | Al agregar una fotografía o nota a una inspección, la evidencia queda asociada al registro y puede consultarse posteriormente. | Versión posterior |
| RF-14 | Identificar registros pendientes de sincronización. | Cuando una inspección se guarda sin conexión, la interfaz muestra que está pendiente hasta que se sincronice correctamente. | Versión posterior |
| RF-15 | Evitar registros duplicados al sincronizar. | Si se intenta enviar dos veces el mismo registro pendiente, el sistema conserva un solo registro en el listado central. | Versión posterior |
| RF-16 | Mostrar un resumen de inspecciones. | La aplicación presenta la cantidad total de inspecciones y la cantidad que requiere atención en el periodo consultado. | Versión posterior |
| RF-17 | Notificar errores de captura. | Si faltan datos obligatorios o la fecha es inválida, se indica qué campo debe corregirse y no se guarda el registro. | Versión posterior |
| RF-18 | Registrar la persona que realizó la inspección. | Cada inspección guardada conserva el identificador o nombre de la persona responsable de realizarla. | Versión posterior |

## 4. Requisitos no funcionales

| Área | Condición o meta | Cómo se comprobará | Momento de validación |
|---|---|---|---|
| Reproducibilidad | En una copia limpia del repositorio, con las versiones de Node.js y npm declaradas en el README, la instalación y la verificación terminan correctamente. | Ejecutar `npm ci` y `npm run verify`; ambos deben finalizar con código 0. | En cada versión publicada. |
| Accesibilidad | La interfaz debe poder recorrerse con teclado, tener estructura semántica y etiquetas comprensibles para los controles. | Revisión manual con teclado y herramientas de accesibilidad del navegador sobre los flujos de consulta y captura. | Antes de liberar los flujos de captura. |
| Seguridad | No se almacenarán credenciales ni secretos dentro del repositorio, la interfaz ni los datos de demostración. | Revisión del repositorio y de las variables de configuración antes de cada publicación. | Durante todo el desarrollo. |
| Privacidad | La aplicación de demostración usará únicamente nombres de rol, ubicaciones y hallazgos ficticios; no recopilará datos personales reales de usuarios o personal. | Revisión del archivo de datos y de los registros de ejemplo. | Al incorporar o modificar fuentes de datos. |
| Rendimiento | Con 100 registros sintéticos en un dispositivo y navegador de prueba declarados, el listado debe mostrarse en menos de 2 segundos en al menos 4 de 5 mediciones. Esta es una meta de calidad pendiente de medición. | Medir cinco cargas en el dispositivo, navegador y condiciones de red documentados. | Cuando exista almacenamiento y listado dinámico. |
| Operación sin conexión | La PWA debe permitir consultar los últimos datos disponibles y guardar inspecciones pendientes sin conexión, informando su estado al usuario. | Desactivar la red en el navegador y comprobar consulta, captura local y sincronización posterior. | Después de implementar almacenamiento local, service worker y sincronización. |

## 5. Datos sintéticos y límites

Los registros de demostración usan los campos ficticios: identificador de inspección, nombre genérico del laboratorio, fecha, rol de la persona inspectora, estado, etiqueta de estado, cantidad de hallazgos y resumen. Los valores actuales, como «Técnica A» o «Laboratorio de Redes», se utilizan solo para ilustrar la interfaz.

No se incluirán nombres, matrículas, teléfonos, correos, fotografías, credenciales, contraseñas, ubicaciones sensibles ni reportes reales de la UTT.

## 6. Criterios de aceptación de la versión inicial

| Elemento validado | Evidencia o comprobación | Qué demuestra | Qué no demuestra |
|---|---|---|---|
| Pantalla inicial | Ejecutar la aplicación en desarrollo y abrir `http://localhost:3000`. | Que se muestran tres inspecciones sintéticas con su información principal. | Que existan captura, operación offline, sincronización o autenticación. |
| Integridad técnica | Ejecutar `npm run verify`. | Que la estructura requerida, la prueba disponible y la compilación completan la verificación técnica. | La cobertura funcional completa ni la calidad del análisis de producto. |
| Requisitos del producto | Revisión de este documento. | Que el problema, escenarios, requisitos, datos y límites son coherentes y verificables. | Que las funciones de versiones posteriores ya estén programadas. |
| Estrategia de aplicación | Revisión de `docs/decision-record.md`. | Que se comparan alternativas tecnológicas y se justifica la estrategia elegida. | Que la aplicación ya cuente con todas las capacidades de una PWA. |
