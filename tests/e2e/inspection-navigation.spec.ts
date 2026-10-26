
import { test, expect } from "@playwright/test";

test("permite cambiar los estados de la pantalla principal", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Inspecciones recientes" })
  ).toBeVisible();

  await page.getByRole("button", { name: /Vacío/ }).click();

  await expect(
    page.getByRole("heading", { name: "No hay inspecciones registradas" })
  ).toBeVisible();

  await page.getByRole("button", { name: /Cargar datos sintéticos/ }).click();

  await expect(
    page.getByRole("heading", { name: "Inspecciones recientes" })
  ).toBeVisible();

  await expect(page.getByText("3 registros")).toBeVisible();
});

test("muestra el estado de error y permite reintentar", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Error de conexión/ }).click();

  await expect(
    page.getByRole("heading", { name: "Fallo de comunicación de red" })
  ).toBeVisible();

  await page.getByRole("button", { name: /Reintentar consulta/ }).click();

  await expect(page.getByText("3 registros")).toBeVisible({
    timeout: 5000,
  });
});
