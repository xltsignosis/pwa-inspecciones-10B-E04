export type GeolocationResult =
  | {
      status: "granted";
      coords: { latitude: number; longitude: number; accuracy: number };
    }
  | { status: "denied"; fallback: "manual"; message: string }
  | { status: "unavailable"; fallback: "manual"; message: string };

export function isGeolocationSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.geolocation?.getCurrentPosition === "function"
  );
}

function manualFallback(status: "denied" | "unavailable"): GeolocationResult {
  return {
    status,
    fallback: "manual",
    message:
      status === "denied"
        ? "Permiso de ubicación denegado. Escribe edificio, zona o referencia manualmente."
        : "No se pudo obtener la ubicación. Escribe edificio, zona o referencia manualmente.",
  };
}

/**
 * Llamar únicamente desde una acción del usuario, por ejemplo "Usar mi ubicación".
 * Importar el módulo o comprobar soporte no solicita permisos. No usar al montar
 * la página, en segundo plano ni para seguimiento continuo.
 *
 * Si el resultado indica fallback: "manual", la interfaz debe conservar el texto
 * existente y permitir escribir edificio/zona/referencia para continuar.
 * Solo devuelve coordenadas y precisión (metros); no las guarda ni las envía.
 */
export async function getCurrentLocation(): Promise<GeolocationResult> {
  if (!isGeolocationSupported()) {
    return manualFallback("unavailable");
  }

  return new Promise((resolve) => {
    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) =>
          resolve({
            status: "granted",
            coords: {
              latitude: coords.latitude,
              longitude: coords.longitude,
              accuracy: coords.accuracy,
            },
          }),
        (error) => resolve(manualFallback(error.code === 1 ? "denied" : "unavailable")),
        {
          enableHighAccuracy: false,
          timeout: 10_000,
          maximumAge: 0,
        },
      );
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      resolve(manualFallback(name === "SecurityError" ? "denied" : "unavailable"));
    }
  });
}
