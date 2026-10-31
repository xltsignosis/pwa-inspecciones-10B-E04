import { test, expect } from "@playwright/test";
import { inspectionFixture } from "../fixtures/inspection";

test("producción entrega cabeceras y nonce por documento sin aceptar el del cliente", async ({ page, request }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setExtraHTTPHeaders({ "Content-Security-Policy": "script-src 'nonce-attacker'" });
  const response = await page.goto("/");
  expect(response).not.toBeNull();
  const headers = response!.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("no-referrer");
  expect(headers["strict-transport-security"]).toBe("max-age=31536000");
  expect(headers["x-robots-tag"]).toBe("noindex, nofollow, noarchive");
  expect(headers["permissions-policy"]).toBe("camera=(self), geolocation=(self), microphone=(), payment=(), usb=()");
  expect(headers["x-powered-by"]).toBeUndefined();
  const policy = headers["content-security-policy"];
  expect(policy).not.toMatch(/unsafe-eval|nonce-attacker/);
  const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
  expect(nonce).toBeTruthy();
  await expect(page.getByRole("button", { name: "Guardar inspección", exact: true })).toBeEnabled();
  const inlineNonces = await page.locator("script:not([src])").evaluateAll(elements => elements.map(element => (element as HTMLScriptElement).nonce));
  expect(inlineNonces.length).toBeGreaterThan(0);
  expect(inlineNonces.every(value => value === nonce)).toBe(true);
  const second = await request.get("/");
  expect(second.headers()["content-security-policy"].match(/'nonce-([^']+)'/)?.[1]).not.toBe(nonce);
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toMatch(/User-agent: \*[\s\S]*Disallow: \//);
  expect(errors).toEqual([]);
});

test("CSP bloquea scripts inline sin nonce y React muestra la entrada como texto", async ({ page }) => {
  const payload = '<img src=x onerror="window.syntheticXss=true">';
  await page.route("**/api/inspecciones/inspection-001", route => route.fulfill({
    json: inspectionFixture({ id: "inspection-001", summary: payload }),
  }));
  await page.goto("/inspecciones/inspection-001");
  await expect(page.getByText(payload, { exact: true })).toBeVisible();
  await expect(page.locator("img[src=x]")).toHaveCount(0);
  const result = await page.evaluate(() => new Promise<{ directive: string; executed: boolean }>(resolve => {
    const state = window as unknown as { syntheticXss?: boolean };
    document.addEventListener("securitypolicyviolation", event => resolve({
      directive: event.effectiveDirective, executed: state.syntheticXss === true,
    }), { once: true });
    const script = document.createElement("script");
    script.textContent = "window.syntheticXss=true";
    document.body.append(script);
  }));
  expect(result.directive).toMatch(/^script-src/);
  expect(result.executed).toBe(false);
});

test("no pide cámara ni ubicación al cargar y conserva alternativas tras denegación", async ({ page }) => {
  const calls: string[] = [];
  await page.exposeFunction("securityCall", (kind: string) => calls.push(kind));
  await page.addInitScript(() => {
    const record = (kind: string) => (window as unknown as { securityCall: (kind: string) => Promise<void> }).securityCall(kind);
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: {
      getUserMedia: async () => { await record("camera"); throw new DOMException("Denegación sintética", "NotAllowedError"); },
    } });
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: {
      getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => {
        void record("location").then(() => error({ code: 1 } as GeolocationPositionError));
      },
    } });
  });
  await page.goto("/inspecciones/inspection-001");
  await expect(page.getByRole("heading", { name: "Evidencia y seguimiento" })).toBeVisible();
  expect(calls).toEqual([]);
  await page.getByRole("button", { name: "Adjuntar foto", exact: true }).click();
  await expect(page.getByText("Permiso de cámara denegado.", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Elegir una imagen")).toBeVisible();
  await expect(page.getByLabel("Elegir una imagen")).not.toHaveAttribute("capture", /.*/);
  const location = page.getByLabel("Edificio, zona o referencia");
  await location.fill("Edificio sintético B");
  await page.getByRole("button", { name: "Usar mi ubicación" }).click();
  await expect(page.getByText("Permiso de ubicación denegado.", { exact: false })).toBeVisible();
  await expect(location).toHaveValue("Edificio sintético B");
  await location.fill("Edificio sintético C");
  await expect(location).toHaveValue("Edificio sintético C");
  expect(calls).toEqual(["camera", "location"]);
});
