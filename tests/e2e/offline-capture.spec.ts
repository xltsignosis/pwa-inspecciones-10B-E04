import { test, expect, type Page, type BrowserContext } from "@playwright/test";

async function prepare(page: Page) {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>(resolve => navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }));
    }
  });
  // Ya controlada: precalienta HTML y recursos reales antes de desconectar.
  await page.reload();
  await expect(page.getByRole("button", { name: "Guardar inspección", exact: true })).toBeEnabled();
  await expect.poll(() => page.evaluate(async () => {
    // Los scripts nomodule son compatibilidad para otros motores y Chromium no los solicita.
    const urls = Array.from(document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>("script[src]:not([nomodule]), link[rel=stylesheet]"))
      .map(element => element instanceof HTMLScriptElement ? element.src : element.href);
    const responses = await Promise.all(urls.map(url => caches.match(url)));
    return urls.filter((_, index) => !responses[index]);
  })).toEqual([]);
}

async function fill(page: Page, laboratory: string) {
  const form = page.getByRole("form", { name: "Captura de inspección" });
  await form.getByLabel("Laboratorio", { exact: true }).fill(laboratory);
  await form.getByLabel("Fecha", { exact: true }).fill("2026-10-25");
  await form.getByLabel("Rol del inspector").fill("Técnico sintético E2E");
  await form.getByLabel("Hallazgos", { exact: true }).fill("2");
  await form.getByRole("combobox", { name: "Estado", exact: true }).selectOption("attention");
  await form.getByLabel("Resumen", { exact: true }).fill("Hallazgo sintético para persistencia offline.");
}

function localRecord(page: Page, laboratory: string) {
  return page.getByRole("region", { name: "Inspecciones de este dispositivo" })
    .getByRole("listitem").filter({ hasText: laboratory });
}

async function saveReloadReconnect(page: Page, context: BrowserContext, laboratory: string) {
  await page.getByRole("button", { name: "Guardar inspección", exact: true }).click();
  const record = localRecord(page, laboratory);
  await expect(record).toHaveCount(1);
  await expect(record.getByRole("status")).toHaveText("Pendiente");
  const clientId = await record.getAttribute("data-client-id");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(record).toHaveCount(1);
  await expect(record).toHaveAttribute("data-client-id", clientId!);
  await expect(record).toContainText("Técnico sintético E2E");
  await expect(record).toContainText("2026-10-25");
  await expect(record).toContainText("Requiere atención");
  await expect(record).toContainText("2 hallazgos");
  await expect(record).toContainText("Hallazgo sintético para persistencia offline.");
  await expect(record.getByRole("status")).toHaveText("Pendiente");
  const responsePromise = page.waitForResponse(response => response.url().endsWith("/api/inspecciones/sync") && response.request().method() === "POST");
  await context.setOffline(false);
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  const operation = response.request().postDataJSON();
  expect(operation.clientId).toBe(clientId);
  expect(response.request().headers()["idempotency-key"]).toBe(clientId);
  await expect(record.getByRole("status")).toHaveText("Sincronizada");
  // La operación real repetida se reconoce en el servidor, no crea otra entrada.
  const retry = await page.request.post("/api/inspecciones/sync", {
    data: operation, headers: { "Idempotency-Key": clientId! },
  });
  expect(retry.status()).toBe(200);
  expect(await retry.json()).toMatchObject({ duplicate: true, version: operation.version });
  await page.reload();
  await expect(record).toHaveCount(1);
  await expect(record.getByRole("status")).toHaveText("Sincronizada");
}

test("crear offline, recargar y reconectar conserva una sola inspección sincronizada", async ({ page, context }) => {
  await prepare(page);
  await context.setOffline(true);
  await fill(page, "Laboratorio offline sintético");
  await saveReloadReconnect(page, context, "Laboratorio offline sintético");
});

for (const camera of ["denied", "unavailable"] as const) {
  test(`completar captura offline sin foto con cámara ${camera}`, async ({ page, context }) => {
    await page.addInitScript(mode => {
      Object.defineProperty(navigator, "mediaDevices", { configurable: true,
        value: mode === "unavailable" ? undefined : {
          getUserMedia: async () => { throw new DOMException("Denegación sintética", "NotAllowedError"); },
        },
      });
    }, camera);
    await prepare(page);
    await context.setOffline(true);
    const laboratory = `Laboratorio cámara ${camera}`;
    await fill(page, laboratory);
    const form = page.getByRole("form", { name: "Captura de inspección" });
    await form.getByRole("button", { name: "Adjuntar foto" }).click();
    await expect(form).toContainText(camera === "denied" ? "Permiso de cámara denegado" : "Cámara no disponible");
    await expect(form.getByRole("img")).toHaveCount(0);
    await saveReloadReconnect(page, context, laboratory);
  });
}

test("captura inválida no inserta registros y conserva los campos", async ({ page }) => {
  await prepare(page);
  await fill(page, "   ");
  await page.getByRole("button", { name: "Guardar inspección", exact: true }).click();
  await expect(page.getByRole("region", { name: "Registrar inspección", exact: true }).getByRole("alert"))
    .toContainText("Completa los campos");
  await expect(page.getByRole("region", { name: "Inspecciones de este dispositivo" }).getByRole("listitem")).toHaveCount(0);
  await expect(page.getByLabel("Resumen", { exact: true })).toHaveValue("Hallazgo sintético para persistencia offline.");
});

test("respuesta perdida tras guardar: el reintento conserva identidad y termina sincronizado", async ({ page, context }) => {
  await page.addInitScript(() => {
    const realFetch = window.fetch.bind(window);
    let loseNext = true;
    window.fetch = async (...args) => {
      const response = await realFetch(...args);
      if (String(args[0]).endsWith("/api/inspecciones/sync") && args[1]?.method === "POST" && response.ok && loseNext) {
        loseNext = false;
        throw new TypeError("Respuesta perdida sintética después de guardar");
      }
      return response;
    };
  });
  await prepare(page);
  await fill(page, "Laboratorio respuesta perdida");
  const firstResponse = page.waitForResponse(response => response.url().endsWith("/api/inspecciones/sync") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Guardar inspección", exact: true }).click();
  const first = await firstResponse;
  expect(await first.json()).toMatchObject({ duplicate: false });
  const record = localRecord(page, "Laboratorio respuesta perdida");
  await expect(record.getByRole("status")).toHaveText("Pendiente");
  await expect(page.getByRole("button", { name: "Guardar inspección", exact: true })).toBeEnabled();
  await context.setOffline(true);
  const retryResponse = page.waitForResponse(response => response.url().endsWith("/api/inspecciones/sync") && response.request().method() === "POST");
  await context.setOffline(false);
  const retry = await retryResponse;
  expect(retry.request().postDataJSON()).toEqual(first.request().postDataJSON());
  expect(await retry.json()).toMatchObject({ duplicate: true });
  await expect(record).toHaveCount(1);
  await expect(record.getByRole("status")).toHaveText("Sincronizada");
});
