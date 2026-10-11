export type NotificationPermissionState = "granted" | "denied" | "default" | "unsupported";

/** Datos mínimos del cambio: no incluye responsable, hallazgos, ubicación ni fotos. */
export type StatusChange = {
  inspectionId: string;
  location: string;
  statusLabel: string;
};

/**
 * `message` viaja en los tres casos: la interfaz siempre muestra el cambio
 * dentro de la app y la notificación del sistema es solo un canal adicional.
 */
export type NotificationResult =
  | { status: "shown"; message: string }
  | { status: "denied"; fallback: "in-app"; message: string }
  | { status: "unavailable"; fallback: "in-app"; message: string };

const NOTIFICATION_TITLE = "Inspección actualizada";

// Si la persona cierra o rechaza el aviso del navegador no se le vuelve a
// preguntar en esta sesión; se reinicia al recargar la página.
let declinedThisSession = false;

export function isNotificationSupported(): boolean {
  return typeof Notification !== "undefined" && typeof Notification.requestPermission === "function";
}

/** Solo lee el estado actual; nunca abre el aviso de permiso. */
export function getNotificationPermission(): NotificationPermissionState {
  return isNotificationSupported() ? Notification.permission : "unsupported";
}

/** Texto del cambio que se muestra en la app y en la notificación del sistema. */
export function describeStatusChange({ location, statusLabel }: StatusChange): string {
  return `${location}: la inspección cambió a «${statusLabel}».`;
}

async function showSystemNotification(title: string, options: NotificationOptions): Promise<void> {
  // Chrome en Android no permite `new Notification()`: ahí solo se puede
  // notificar a través del service worker que ya registra la app.
  const registration =
    typeof navigator !== "undefined" ? await navigator.serviceWorker?.getRegistration() : undefined;
  if (registration?.active) {
    await registration.showNotification(title, options);
    return;
  }
  new Notification(title, options);
}

/**
 * Llamar únicamente desde la acción que cambia el estado de una inspección.
 * Importar el módulo o consultar el permiso no pide nada: el aviso del
 * navegador aparece la primera vez que hay un cambio que notificar.
 *
 * Nunca rechaza la promesa. Si el permiso se niega o la API no existe devuelve
 * `fallback: "in-app"` y la app sigue mostrando `message` en la interfaz.
 */
export async function notifyStatusChange(change: StatusChange): Promise<NotificationResult> {
  const message = describeStatusChange(change);
  if (!isNotificationSupported()) {
    return { status: "unavailable", fallback: "in-app", message };
  }

  try {
    let permission = Notification.permission;
    if (permission === "default" && !declinedThisSession) {
      await Notification.requestPermission();
      // Se vuelve a leer la propiedad en lugar del valor devuelto porque
      // versiones antiguas de Safari responden por callback y devuelven undefined.
      permission = Notification.permission;
      if (permission !== "granted") declinedThisSession = true;
    }
    if (permission !== "granted") {
      return { status: "denied", fallback: "in-app", message };
    }

    await showSystemNotification(NOTIFICATION_TITLE, {
      body: message,
      // Un cambio nuevo de la misma inspección reemplaza al anterior.
      tag: change.inspectionId,
      data: { url: `/inspecciones/${encodeURIComponent(change.inspectionId)}` },
    });
    return { status: "shown", message };
  } catch {
    return { status: "unavailable", fallback: "in-app", message };
  }
}
