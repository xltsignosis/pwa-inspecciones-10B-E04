# Inventario de datos y privacidad — Semana 9

## 1. Objetivo

Documentar los datos que utiliza la PWA de inspecciones y mantenimiento de laboratorios, su finalidad, almacenamiento, acceso y riesgos de privacidad.

La actividad se desarrolla exclusivamente con datos sintéticos. No deben registrarse datos personales reales ni fotografías de personas.

## 2. Inventario de datos

| Dato | Finalidad | Almacenamiento actual | Sensibilidad y riesgo |
|---|---|---|---|
| Identificador de inspección (`id`) | Identificar cada registro | IndexedDB y servidor sintético | Puede relacionar información de una inspección |
| Laboratorio (`location`) | Identificar el espacio inspeccionado | IndexedDB y servidor sintético | Puede revelar información operativa |
| Fecha (`date`) | Registrar cuándo se realizó la inspección | IndexedDB y servidor sintético | Permite conocer el momento de una actividad |
| Inspector (`inspector`) | Identificar el rol o responsable de prueba | IndexedDB y servidor sintético | No usar nombres reales; utilizar roles sintéticos |
| Estado (`status`, `statusLabel`) | Indicar la condición del laboratorio | IndexedDB y servidor sintético | Información operativa |
| Número de hallazgos (`findings`) | Registrar observaciones detectadas | IndexedDB y servidor sintético | Puede revelar problemas de mantenimiento |
| Resumen (`summary`) | Describir brevemente la inspección | IndexedDB y servidor sintético | Evitar datos personales o información sensible |
| `clientId` | Identificar una operación y evitar duplicados | IndexedDB y servidor sintético | Metadato técnico que permite relacionar reintentos |
| Versiones y estado de sincronización | Controlar cambios, pendientes y conflictos | IndexedDB y servidor sintético | Metadatos técnicos |
| Copia remota (`remoteCopy`) | Conservar la versión del servidor ante conflictos | IndexedDB | Puede contener una copia del registro |
| Fotografía (`Blob`) | Mostrar evidencia visual opcional | Memoria temporal de la pestaña | Puede revelar personas, documentos o espacios |
| Coordenadas y precisión | Obtener una referencia geográfica puntual | Estado temporal de la interfaz | Dato de ubicación que puede ser sensible |
| Texto manual de ubicación | Describir edificio, zona o referencia | Estado temporal de la interfaz de capacidades | Puede identificar un espacio específico |
| Notificación | Informar un cambio de estado | Notificación del sistema y mensaje en la aplicación | Puede ser visible en una pantalla bloqueada |

## 3. Finalidades del tratamiento

Los datos se utilizan exclusivamente para:

- Registrar inspecciones sintéticas de laboratorios.
- Consultar el estado de una inspección.
- Mantener registros locales cuando no hay conexión.
- Sincronizar registros pendientes al recuperar la conectividad.
- Detectar cambios concurrentes y conservar las copias en conflicto.
- Mostrar avisos sobre cambios de estado.
- Probar el comportamiento de cámara, ubicación y notificaciones.

No se contempla utilizar los datos para publicidad, perfiles de estudiantes ni seguimiento continuo de ubicación.

## 4. Almacenamiento y transmisión

### IndexedDB

La base local se denomina `laboratory-inspections` y contiene los registros y metadatos necesarios para la sincronización offline.

La aplicación conserva información pendiente hasta que exista una confirmación de sincronización.

### Servidor sintético

El endpoint `POST /api/inspecciones/sync` recibe operaciones y utiliza un `Map` en memoria por proceso. Esto no proporciona persistencia entre reinicios o instancias.

### Fotografías

La fotografía capturada se convierte en una vista previa temporal de la pestaña. No se guarda en IndexedDB ni se transmite al servidor.

### Ubicación

La función de geolocalización devuelve latitud, longitud y precisión. El módulo no guarda ni envía esas coordenadas. La interfaz muestra una referencia temporal que puede editarse manualmente.

### Notificaciones

Las notificaciones incluyen el nombre del laboratorio y el estado nuevo. No deben incluir nombres de responsables, hallazgos, resúmenes ni fotografías.

## 5. Minimización de datos

Se aplican los siguientes criterios:

- Utilizar roles sintéticos en lugar de nombres reales.
- Registrar solo los campos necesarios para el funcionamiento de una inspección.
- Mantener la fotografía como una capacidad opcional y temporal.
- Solicitar ubicación solo cuando la persona presiona el botón correspondiente.
- No utilizar seguimiento continuo de ubicación.
- Mantener las notificaciones limitadas al laboratorio y al estado.
- No almacenar secretos, contraseñas ni tokens en los registros de inspección.

## 6. Acceso, conservación y eliminación

En el estado actual del proyecto, los registros permanecen en el almacenamiento local hasta que se eliminen mediante mecanismos de mantenimiento de la base o del navegador. El servidor sintético conserva los registros mientras exista el proceso que mantiene su `Map`.

No existe todavía una política de retención de producción ni un mecanismo completo de borrado remoto. Antes de utilizar datos reales se debe definir:

- Quién está autorizado para consultar o modificar cada registro.
- Cuánto tiempo se conservarán las inspecciones.
- Cómo se eliminarán los registros locales y remotos.
- Qué ocurre con las copias pendientes y los conflictos.
- Cómo se atenderán solicitudes de acceso, corrección o eliminación cuando correspondan.

## 7. Riesgos de privacidad

| Riesgo | Medida preventiva |
|---|---|
| Registrar nombres reales en el campo inspector | Utilizar roles sintéticos |
| Escribir información personal en el resumen | Validar y orientar la captura a observaciones técnicas |
| Fotografiar personas o documentos | Evitar capturar información no necesaria y mantener la foto opcional |
| Exponer información en notificaciones | Mostrar únicamente laboratorio y estado |
| Dejar registros en dispositivos compartidos | Definir retención, borrado y control de acceso |
| Exponer coordenadas | Solicitar ubicación solo por acción explícita y no transmitirla innecesariamente |

## 8. Supuestos y limitaciones

- Todos los registros de desarrollo y pruebas son sintéticos.
- La fotografía no se persiste ni se sincroniza.
- La geolocalización no se guarda ni se envía desde el módulo consultado.
- El servidor es temporal y no representa una infraestructura de producción.
- No se ha demostrado una política de retención o eliminación remota.
- El almacenamiento local no debe considerarse cifrado.
- La aplicación requiere controles adicionales de autenticación y autorización antes de tratar datos reales.

## 9. Declaración de privacidad

La PWA se desarrolla con el principio de minimización de datos: utiliza únicamente información necesaria para demostrar la captura, consulta y sincronización de inspecciones. Las capacidades de cámara y ubicación son opcionales y dependen de una acción explícita. El proyecto utiliza datos sintéticos y no debe incorporar información personal real durante esta actividad.