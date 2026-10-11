# Capacidades del dispositivo y notificaciones — Semana 6

Este documento explica cómo la PWA usa la cámara, la ubicación y las notificaciones: cuándo pide cada permiso, qué pasa si la persona lo niega y qué pasa si el navegador no tiene la API. Las tres capacidades son opcionales; ninguna es necesaria para consultar una inspección. Todos los datos son sintéticos.

## Piezas

| Archivo | Responsabilidad |
|---|---|
| `src/lib/device/camera.ts` | `isCameraSupported()` y `captureEvidence()`: toma un cuadro de la cámara trasera como `Blob` JPEG y apaga la cámara. |
| `src/lib/device/geolocation.ts` | `isGeolocationSupported()` y `getCurrentLocation()`: una lectura puntual de latitud, longitud y precisión. |
| `src/lib/notifications/client.ts` | `isNotificationSupported()`, `getNotificationPermission()`, `describeStatusChange()` y `notifyStatusChange()`: avisa de un cambio de estado. |
| `src/components/inspection-capabilities.tsx` | Panel "Evidencia y seguimiento" del detalle `/inspecciones/[id]`: tres botones y sus alternativas. |
| `public/sw.js` (`notificationclick`) | Al tocar la notificación enfoca o abre la inspección. |
| `tests/capabilities.spec.ts`, `tests/geolocation.spec.ts` | Pruebas con las APIs simuladas en Node. |

Las tres funciones principales siguen el mismo contrato: devuelven una promesa que **nunca se rechaza** y un objeto con `status`, de modo que la interfaz solo tiene que decidir qué mostrar.

| Función | Concedido | Denegado | No disponible |
|---|---|---|---|
| `captureEvidence()` | `{ status: "captured", blob }` | `{ status: "denied" }` | `{ status: "unavailable" }` |
| `getCurrentLocation()` | `{ status: "granted", coords }` | `{ status: "denied", fallback: "manual", message }` | `{ status: "unavailable", fallback: "manual", message }` |
| `notifyStatusChange()` | `{ status: "shown", message }` | `{ status: "denied", fallback: "in-app", message }` | `{ status: "unavailable", fallback: "in-app", message }` |

## Principio: nunca pedir permisos de entrada

Ningún permiso se solicita al cargar la página, al importar un módulo ni al consultar si la API existe. El aviso del navegador aparece únicamente como respuesta al clic de la persona sobre la acción que lo necesita.

Por qué:

- **Contexto.** Un aviso al abrir la app no dice para qué es el permiso. Después de presionar "Adjuntar foto" la razón es evidente y es más probable que se conceda.
- **El "no" suele ser definitivo.** Si la persona bloquea un permiso, el navegador no vuelve a preguntar; hay que cambiarlo a mano en la configuración del sitio. Pedirlo en mal momento puede perder la capacidad para siempre.
- **Permiso mínimo.** Quien solo consulta inspecciones nunca ve un aviso ni entrega un dato. Se pide lo que la acción necesita y nada más: video sin audio, una lectura de ubicación sin seguimiento.
- **Los navegadores lo exigen.** Varios ignoran o penalizan las solicitudes de notificaciones que no vienen de un gesto del usuario.
- **La app no depende del permiso.** Como el flujo funciona sin la capacidad, no hay motivo para insistir.

## Flujo de un permiso

Es el mismo para las tres capacidades; cambia la alternativa del final.

```
 carga de la página ──→ no se pide nada (los módulos solo exponen funciones)

 clic en el botón
       │
       ▼
 ¿existe la API? ──no──→ unavailable ──┐
       │ sí                            │
       ▼                               │
 ¿permiso ya decidido?                 │
   │ concedido   │ denegado            │
   │             └──────→ denied ──────┤
   │ sin decidir                       │
   ▼                                   │
 aviso del navegador                   │
   │ permite    │ bloquea o cierra     │
   │            └───────→ denied ──────┤
   ▼                                   ▼
 usa la capacidad               alternativa, la app sigue:
   │ error del dispositivo        · foto → elegir imagen o continuar sin foto
   └────→ unavailable ──────────→ · ubicación → escribirla a mano
   │                              · aviso → mensaje dentro de la página
   ▼
 resultado (foto / coordenadas / notificación del sistema)
```

## Cámara (`camera.ts`)

- **Cuándo se pide.** Al presionar "Adjuntar foto". `captureEvidence()` llama a `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })`: cámara trasera y sin micrófono.
- **Si se niega.** `NotAllowedError` o `SecurityError` devuelven `denied`. El panel muestra el aviso y habilita "Elegir una imagen" (`<input type="file" accept="image/*" capture>`), que no requiere el permiso de cámara de la página. También se puede continuar sin foto.
- **Si la API no existe.** `unavailable`, sin llamar a nada. Ocurre en navegadores antiguos y en páginas servidas sin HTTPS (fuera de `localhost`). Lo mismo cuando no hay cámara, está en uso por otra app o el stream no entrega imagen. La alternativa es la misma que al negarse.
- **Qué se hace con la foto.** El `Blob` queda en memoria de la pestaña para la vista previa (`URL.createObjectURL`, liberado al cambiar la foto o salir). No se sube, no se guarda en IndexedDB y no entra en la cola de sincronización. La cámara se apaga en el `finally` (`track.stop()`) haya o no captura.

## Ubicación (`geolocation.ts`)

- **Cuándo se pide.** Al presionar "Usar mi ubicación". Es una sola lectura con `getCurrentPosition` (`enableHighAccuracy: false`, `timeout: 10000`, `maximumAge: 0`); no hay `watchPosition` ni lectura en segundo plano.
- **Si se niega.** Código de error 1 → `denied` con `fallback: "manual"`. El campo "Edificio, zona o referencia" está siempre visible y conserva lo que ya se había escrito.
- **Si la API no existe.** `unavailable` con el mismo `fallback: "manual"`. También cuando la posición no se puede determinar o vence el tiempo de espera.
- **Qué se hace con la ubicación.** El módulo devuelve solo latitud, longitud y precisión; descarta altitud, rumbo y velocidad. El panel las redondea a cuatro decimales (unos 11 m, suficiente para un edificio) y las escribe en el campo de texto, donde se pueden corregir. No se envían ni se guardan.

## Notificaciones (`notifications/client.ts`)

- **Cuándo se pide.** La primera vez que una inspección cambia de estado, dentro del clic en "Marcar como…". `notifyStatusChange()` llama a `Notification.requestPermission()` solo si el permiso está sin decidir. Si la persona cierra el aviso, no se vuelve a preguntar hasta recargar la página.
- **Si se niega.** `denied` con `fallback: "in-app"`. No se vuelve a pedir.
- **Si la API no existe.** `unavailable` con `fallback: "in-app"`. También si mostrar la notificación lanza una excepción.
- **El aviso dentro de la app no es solo un respaldo.** El cambio se muestra siempre en la página (`role="status"`, `aria-live="polite"`), con `describeStatusChange()`, antes de conocer la respuesta al permiso. La notificación del sistema es un canal adicional para cuando la pestaña no está a la vista.
- **Cómo se muestra.** Si hay un service worker activo se usa `registration.showNotification()`, porque Chrome en Android no permite `new Notification()` desde la página. En otro caso se usa el constructor.
- **Qué contiene.** Título fijo, el nombre del laboratorio y el estado nuevo. `tag` es el id de la inspección, así un cambio nuevo reemplaza al anterior en lugar de acumularse. No incluye responsable, hallazgos, coordenadas ni foto.

**Decisión: notificación local, no push remoto.** Se usa la Notifications API desde la propia app. Un push real (Push API) permitiría avisar con la app cerrada, pero necesita un servidor que guarde la suscripción de cada dispositivo y un par de claves de servidor, es decir, credenciales que este repositorio no debe contener y un backend que el proyecto todavía no tiene. El trade-off aceptado es que el aviso solo sale mientras la app está abierta en alguna pestaña.

## Riesgo residual: datos que se podrían recolectar de más

| Capacidad | Qué podría recolectarse de más | Cómo se limita hoy | Qué queda pendiente |
|---|---|---|---|
| Cámara | Rostros, pantallas o documentos que aparezcan en la toma; audio; video continuo; metadatos de la imagen. | `audio: false`; un solo cuadro; la cámara se apaga siempre; el cuadro se vuelve a codificar desde un canvas, sin metadatos; nada sale del dispositivo. | La imagen elegida con "Elegir una imagen" es el archivo original y puede traer metadatos EXIF (fecha, modelo, a veces GPS). Antes de subir fotos a un servidor habría que limpiarlos y pedir que no se fotografíe a personas. |
| Ubicación | Posición exacta, historial de movimientos o rutinas del personal si se leyera de forma continua o se guardara con hora y responsable. | Una lectura por clic; baja precisión; solo tres valores; redondeo a ~11 m; no se guarda ni se envía. | Si en el futuro se sincroniza, guardar el edificio en lugar de las coordenadas y no asociarlas al nombre de la persona. |
| Notificaciones | El texto se ve en la pantalla bloqueada y queda en el centro de notificaciones del sistema; un push remoto además obligaría a guardar un identificador por dispositivo. | Texto mínimo, sin nombres ni detalle del hallazgo; sin suscripción ni identificadores. | Si se agrega push, la suscripción debe poder borrarse y no ligarse a datos personales. |

Riesgo común: una vez concedido, el permiso sigue vigente para el sitio. El código no lo aprovecha (cada uso sigue naciendo de un clic), y `tests/capabilities.spec.ts` falla si alguien mueve una de estas llamadas a la carga de la página.

## Evidencia (`tests/capabilities.spec.ts`)

| Requisito | Caso |
|---|---|
| No se piden permisos al cargar | "importar los módulos y consultar soporte no pide ningún permiso"; "la interfaz solo usa las capacidades desde un botón, nunca al cargar" |
| API no disponible sin excepción | "sin las APIs ninguna función lanza y cada una devuelve su alternativa" |
| Cámara denegada o con fallo | "cámara: el permiso denegado y los fallos del dispositivo no rompen el flujo" |
| Permiso mínimo de cámara | "cámara: captura una imagen, pide solo video y siempre apaga la cámara" |
| Ubicación mínima y captura manual | "ubicación: devuelve solo coordenadas y precisión, o la captura manual" |
| Notificación denegada → aviso en la app | "notificaciones: con permiso denegado no se vuelve a pedir y el cambio se muestra en la app" |
| Permiso solo en el primer cambio | "notificaciones: el permiso se pide una sola vez, en el primer cambio de estado"; "notificaciones: si la persona cierra el aviso no se insiste en la misma sesión" |
| Datos mínimos en el aviso | "notificaciones: el aviso del sistema lleva solo laboratorio y estado nuevo" |
| Fallo al mostrar → aviso en la app | "notificaciones: usa el service worker activo y sobrevive a un constructor que falla" |

`tests/geolocation.spec.ts` cubre además el timeout, la excepción síncrona y la respuesta diferida de la ubicación.

Las pruebas detectan regresiones. Se comprobó alterando el código a propósito: si `notifyStatusChange` vuelve a pedir el permiso estando denegado, si deja escapar la excepción del constructor o si la cámara pide `audio: true`, la suite falla.

## Supuestos y límites

- Las pruebas simulan `navigator`, `Notification` y `document` en Node. No validan el diálogo real de permisos, la calidad de la imagen ni la precisión de un dispositivo; eso se revisa a mano en el navegador (pasos en el README).
- La foto, la ubicación y el cambio de estado viven en el estado de la página: al recargar se pierden. Todavía no se conectan con IndexedDB ni con la cola de sincronización de la Semana 5.
- `captureEvidence()` toma el primer cuadro del stream sin mostrar una vista previa en vivo; en algunos dispositivos ese cuadro puede salir oscuro y hay que repetir la toma.
- La notificación es local: no llega con la app cerrada y no avisa a otros dispositivos.
- Si el permiso quedó bloqueado, la app no puede volver a pedirlo; solo la persona puede reactivarlo en la configuración del sitio.
- Cámara, ubicación, notificaciones y service worker requieren HTTPS o `localhost`. En una red local por HTTP el navegador las bloquea: según el caso responden `unavailable` o `denied`, y se usan las alternativas.
