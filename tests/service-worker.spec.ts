import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

async function run() {
  const sw = await readFile(resolve(root, "public/sw.js"), "utf8");

  // Debe existir un nombre de caché versionado, no un nombre fijo sin versión.
  assert.match(
    sw,
    /CACHE_VERSION\s*=\s*["'`][^"'`]+["'`]/,
    "El service worker debe declarar una versión de caché (CACHE_VERSION)",
  );
  assert.match(
    sw,
    /PRECACHE_NAME\s*=\s*`[^`]*\$\{CACHE_VERSION\}[^`]*`/,
    "El nombre de la caché de precache debe incluir la versión (CACHE_VERSION)",
  );
  assert.match(
    sw,
    /RUNTIME_CACHE_NAME\s*=\s*`[^`]*\$\{CACHE_VERSION\}[^`]*`/,
    "El nombre de la caché de runtime debe incluir la versión (CACHE_VERSION)",
  );

  // Los 3 eventos del ciclo de vida del service worker deben estar registrados.
  assert.match(
    sw,
    /self\.addEventListener\(\s*["']install["']/,
    "Debe registrar el evento 'install'",
  );
  assert.match(
    sw,
    /self\.addEventListener\(\s*["']activate["']/,
    "Debe registrar el evento 'activate'",
  );
  assert.match(
    sw,
    /self\.addEventListener\(\s*["']fetch["']/,
    "Debe registrar el evento 'fetch'",
  );

  // El evento install debe precachear una lista de recursos no vacía, incluyendo el shell.
  const precacheMatch = sw.match(/PRECACHE_URLS\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(precacheMatch, "Debe existir una lista PRECACHE_URLS");
  const precacheEntries = precacheMatch![1]
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  assert.ok(precacheEntries.length > 0, "La lista de precache no debe estar vacía");
  assert.match(sw, /PRECACHE_URLS\s*=\s*\[[\s\S]*?["']\/["'][\s\S]*?\]/, "La lista de precache debe incluir el shell ('/')");

  const installBlockMatch = sw.match(
    /self\.addEventListener\(\s*["']install["'][\s\S]*?\{([\s\S]*?)\n\}\);/,
  );
  assert.ok(installBlockMatch, "Debe existir el cuerpo del listener 'install'");
  assert.match(
    installBlockMatch![1],
    /caches\.open\(\s*PRECACHE_NAME\s*\)[\s\S]*?addAll\(\s*PRECACHE_URLS\s*\)/,
    "El evento install debe abrir la caché de precache y agregar PRECACHE_URLS",
  );

  // El evento activate debe limpiar cachés viejas para no mezclar versiones (actualización segura).
  const activateBlockMatch = sw.match(
    /self\.addEventListener\(\s*["']activate["'][\s\S]*?\{([\s\S]*?)\n\}\);/,
  );
  assert.ok(activateBlockMatch, "Debe existir el cuerpo del listener 'activate'");
  const activateBody = activateBlockMatch![1];
  assert.match(activateBody, /caches\s*\.\s*keys\(\)/, "activate debe listar las cachés existentes con caches.keys()");
  assert.match(
    activateBody,
    /caches\.delete\(/,
    "activate debe borrar las cachés que ya no correspondan a la versión actual",
  );
  assert.match(
    activateBody,
    /cacheName\s*!==\s*PRECACHE_NAME|cacheName\s*!==\s*RUNTIME_CACHE_NAME/,
    "activate debe distinguir la versión actual de las versiones viejas antes de borrar",
  );

  // El evento fetch debe existir y decidir qué hacer con cada petición.
  assert.match(
    sw,
    /self\.addEventListener\(\s*["']fetch["'][\s\S]*?event\.respondWith\(/,
    "El evento fetch debe interceptar la petición con event.respondWith",
  );

  console.log("service-worker.spec.ts: PASS");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
