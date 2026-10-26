export function registerServiceWorker(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!("serviceWorker" in navigator)) {
    console.warn("Este navegador no soporta service workers; la app seguirá funcionando sin capacidad offline.");
    return;
  }

  const register = () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service worker registrado con éxito:", registration.scope);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("Hay una nueva versión del service worker disponible.");
            }
          });
        });
      })
      .catch((error) => {
        console.error("No se pudo registrar el service worker:", error);
      });
  };
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
