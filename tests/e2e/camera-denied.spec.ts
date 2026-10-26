
import { test, expect } from "@playwright/test";

test("permite continuar sin foto cuando se deniega la cámara", async ({
  page,
}) => {
  // Simula que el navegador deniega el permiso de cámara.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: () =>
          Promise.reject(
            new DOMException("Permiso denegado", "NotAllowedError")
          ),
      },
    });
  });

  // Abre el listado de inspecciones sintéticas.
  await page.goto("/inspecciones");

  // Entra en el detalle de la primera inspección.
  await page.getByRole("link").first().click();

  // Comprueba que aparece el componente de capacidades.
  await expect(
    page.getByRole("heading", { name: "Evidencia y seguimiento" })
  ).toBeVisible();

  // Intenta adjuntar una foto.
  await page.getByRole("button", { name: "Adjuntar foto" }).click();

  // Comprueba que se informa de la denegación y se ofrece una alternativa.
  await expect(
    page.getByText(
      "Permiso de cámara denegado. Puedes elegir una imagen o continuar sin foto."
    )
  ).toBeVisible();

  await expect(
    page.getByLabel("Elegir una imagen")
  ).toBeVisible();

  // No debe aparecer una foto capturada.
  await expect(
    page.getByRole("img", {
      name: "Foto adjunta como evidencia de la inspección",
    })
  ).toHaveCount(0);
});
