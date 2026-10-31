# Modelo de amenazas y controles de seguridad — Semana 9

## 1. Objetivo y alcance

Este documento identifica los activos, amenazas, riesgos y controles de seguridad de la PWA de inspecciones y mantenimiento de laboratorios de la Universidad Tecnológica de Tehuacán.

El análisis considera la captura de inspecciones, el almacenamiento local mediante IndexedDB, la sincronización con el endpoint `/api/inspecciones/sync`, las capacidades del dispositivo y el funcionamiento offline.

Se utilizan exclusivamente datos sintéticos. No se deben introducir nombres, fotografías, ubicaciones personales ni observaciones reales de estudiantes o personal.

## 2. Activos que deben protegerse

| Activo | Descripción | Prioridad |
|---|---|---|
| Registros de inspección | Laboratorio, fecha, inspector, estado, hallazgos y resumen | Alta |
| Base IndexedDB | Registros almacenados en el dispositivo | Alta |
| Cola de sincronización | Operaciones pendientes y sus versiones | Alta |
| Copia remota | Registros recibidos por el endpoint de sincronización | Alta |
| Identificadores | `clientId`, identificadores de inspección y versiones | Media |
| Capacidades del dispositivo | Cámara, ubicación y notificaciones | Media |
| Código y configuración | Validación, service worker y configuración de seguridad | Alta |

## 3. Límites y componentes de confianza

- Navegador: ejecuta la PWA y controla los permisos del dispositivo.
- Aplicación cliente: valida y captura los datos de inspección.
- IndexedDB: conserva los registros y la cola offline.
- Endpoint de sincronización: recibe operaciones mediante `POST /api/inspecciones/sync`.
- Servidor sintético: mantiene temporalmente registros en un `Map` en memoria.
- GitHub Actions: ejecuta las verificaciones automatizadas del repositorio.

La información local y la remota deben tratarse como datos no confiables hasta completar las validaciones correspondientes.

## 4. Amenazas identificadas

| ID | Amenaza | Impacto | Control o mitigación |
|---|---|---|---|
| T-01 | Captura de datos manipulados o incompletos | Registros incorrectos y errores de sincronización | Validar tipos, campos obligatorios, estados permitidos y valores numéricos tanto en cliente como en servidor |
| T-02 | Envío de operaciones duplicadas | Registros repetidos | Mantener un `clientId` estable y comprobar la idempotencia en el servidor |
| T-03 | Modificación concurrente de una inspección | Pérdida o sobrescritura de información | Comparar versiones y conservar ambas copias cuando exista conflicto |
| T-04 | Acceso no autorizado al endpoint | Lectura o modificación indebida de registros | Incorporar autenticación y autorización antes de usar datos reales |
| T-05 | Exposición de información almacenada localmente | Acceso a registros desde un dispositivo compartido o comprometido | Minimizar datos, controlar el acceso al dispositivo y definir una política de retención y borrado |
| T-06 | Uso excesivo de permisos del dispositivo | Captura innecesaria de imágenes o ubicación | Solicitar permisos únicamente después de una acción explícita y permitir alternativas |
| T-07 | Exposición de secretos en el repositorio o cliente | Uso indebido de credenciales | Utilizar variables de entorno del servidor, no publicar secretos y revisar cambios antes de subirlos |
| T-08 | Ejecución de contenido no confiable mediante scripts | Manipulación de la interfaz o extracción de información | Aplicar CSP restrictiva, evitar scripts inseguros y validar datos antes de mostrarlos |
| T-09 | Intercepción de comunicaciones | Exposición o alteración de datos durante la sincronización | Utilizar HTTPS en despliegue y no transmitir información sensible por HTTP |
| T-10 | Exposición de información en notificaciones | Divulgación de detalles en la pantalla bloqueada | Mantener los mensajes mínimos y no incluir responsables, hallazgos ni fotografías |

## 5. Controles existentes

### Validación

La aplicación utiliza `isValidInspection` para verificar los campos de una inspección. La entrada del endpoint también pasa por `validateOperation` antes de modificar el almacén.

### Sincronización e integridad

La cola conserva el identificador `clientId` en los reintentos. El servidor detecta operaciones repetidas y responde con un conflicto HTTP 409 cuando las versiones no coinciden.

### Permisos

La cámara, la ubicación y las notificaciones son opcionales. Los permisos se solicitan al ejecutar la acción correspondiente y existen alternativas cuando el usuario los deniega o el navegador no dispone de la API.

### Privacidad de fotografías y ubicación

Las fotografías capturadas se conservan temporalmente en memoria y no se guardan ni sincronizan. La función de geolocalización devuelve coordenadas y precisión, pero no las almacena ni las envía por sí misma.

### Notificaciones

El contenido se limita al laboratorio y al estado de la inspección. No incluye el responsable, los hallazgos ni las fotografías.

## 6. Riesgos pendientes y controles recomendados

1. **Autenticación y autorización:** el endpoint actual es sintético y no implementa una identidad de usuario. Antes de utilizar información real debe verificarse quién puede consultar o modificar cada inspección.
2. **Persistencia remota:** el `Map` del servidor no garantiza persistencia entre reinicios o instancias. Debe sustituirse por un almacenamiento persistente con controles de acceso.
3. **Protección local:** IndexedDB no debe considerarse cifrado. Se debe valorar el riesgo de dispositivos compartidos y definir borrado y retención.
4. **CSP y encabezados:** revisar la configuración completa de despliegue y establecer una política restrictiva que permita solo los orígenes indispensables.
5. **Secretos:** mantener credenciales fuera del código cliente, del repositorio y de los registros de CI.
6. **Transporte:** exigir HTTPS en el entorno desplegado.

## 7. Supuestos y limitaciones

- Los registros utilizados son sintéticos.
- El servidor de sincronización es una simulación en memoria, no un servicio persistente de producción.
- La aplicación no demuestra todavía autenticación y autorización por usuario.
- Las fotografías son temporales y no forman parte de la sincronización.
- Las pruebas automatizadas no equivalen a una auditoría de seguridad ni certifican todos los navegadores y dispositivos.
- La CSP y los encabezados deben verificarse en el entorno final de despliegue.

## 8. Conclusión

La PWA ya incorpora controles importantes de validación, sincronización idempotente y permisos mínimos. Sin embargo, antes de utilizar información real se requiere fortalecer la autenticación, autorización, persistencia, protección de datos locales y configuración de seguridad del despliegue.

El objetivo es mantener la confidencialidad, integridad y disponibilidad de los registros sin recopilar información innecesaria.