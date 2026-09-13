import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

async function run() {
  const page = await readFile(resolve(root, "src/app/page.tsx"), "utf8");

  // Las 4 ramas de estado de UI deben existir (carga, vacío, error, listo).
  assert.match(page, /viewState === "loading"/, "Debe existir el estado de carga");
  assert.match(page, /viewState === "empty"/, "Debe existir el estado vacío");
  assert.match(page, /viewState === "error"/, "Debe existir el estado de error");
  assert.match(page, /viewState === "ready"/, "Debe existir el estado listo (con datos)");

  // Estado de carga: skeleton accesible anunciado a lectores de pantalla.
  assert.match(page, /role="status"/, "El estado de carga debe anunciarse con role=\"status\"");
  assert.match(page, /aria-busy="true"/, "El estado de carga debe marcar aria-busy=\"true\"");

  // Estado vacío: debe ofrecer una acción de recuperación, no un callejón sin salida.
  assert.match(
    page,
    /empty-state[\s\S]*?<button[\s\S]*?<\/button>/,
    "El estado vacío debe incluir un botón de acción"
  );

  // Estado de error: debe anunciarse como alerta y ofrecer reintentar.
  assert.match(page, /role="alert"/, "El estado de error debe anunciarse con role=\"alert\"");
  assert.match(page, /aria-live="assertive"/, "El estado de error debe usar aria-live=\"assertive\"");
  assert.match(page, /Reintentar/i, "El estado de error debe ofrecer una acción para reintentar");

  // El reintento de error debe pasar primero por "loading" antes de volver a "ready",
  // en vez de saltar directo a un estado optimista sin retroalimentación.
  const errorBlockMatch = page.match(/\{viewState === "error" && \([\s\S]*?\{viewState === "ready"/);
  assert.ok(errorBlockMatch, "Debe existir el bloque JSX de renderizado del estado de error");
  assert.match(
    errorBlockMatch[0],
    /setViewState\("loading"\)[\s\S]*?setViewState\("ready"\)/,
    'El botón de reintentar debe transicionar a "loading" antes de volver a "ready"'
  );

  console.log("ui-states.spec.mjs: PASS");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
