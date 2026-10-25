
import { test, expect } from "@playwright/test";

test("la aplicación muestra las inspecciones del laboratorio", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Inspecciones de laboratorio" })
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Inspecciones recientes" })
  ).toBeVisible();

  await expect(page.getByText("Laboratorio de Redes")).toBeVisible();
  await expect(page.getByText("Laboratorio de Electrónica")).toBeVisible();
  await expect(page.getByText("Laboratorio de Software")).toBeVisible();
});
