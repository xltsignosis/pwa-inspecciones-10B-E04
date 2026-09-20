import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

async function run() {
  const sw = await readFile(resolve(root, "public/sw.js"), "utf8");
  const register = await readFile(
    resolve(root, "src/lib/pwa/register-service-worker.ts"),
    "utf8",
  );

  // El fetch handler debe contemplar el caso de fallo de red (try/catch alrededor de fetch()).
  assert.match(
    sw,
    /try\s*\{[\s\S]*?await fetch\(request\)[\s\S]*?\}\s*catch/,
    "La lógica de fetch debe capturar el fallo de red con try/catch alrededor de fetch(request)",
  );

  // Cuando la red falla, debe intentar servir algo desde caché antes de rendirse.
  const catchBlockMatch = sw.match(/\}\s*catch\s*\{([\s\S]*?)\n\}/);
  assert.ok(catchBlockMatch, "Debe existir un bloque catch para el fallo de red");
  const catchBody = catchBlockMatch![1];
  assert.match(
    catchBody,
    /caches\.match\(/,
    "Al fallar la red, debe intentar recuperar una respuesta desde la caché",
  );

  // Debe existir un fallback offline explícito: el shell precacheado ('/') como página
  // de recuperación cuando ni la red ni la caché específica tienen la respuesta.
  assert.match(
    catchBody,
    /caches\.match\(\s*["']\/["']\s*\)/,
    "Debe existir un fallback al shell precacheado ('/') cuando falla la navegación offline",
  );

  // Si tampoco hay shell cacheado, debe devolver una respuesta de reserva en vez de
  // dejar que el navegador muestre su error genérico de conexión.
  assert.match(
    catchBody,
    /new Response\(/,
    "Debe devolver una Response de reserva cuando no hay nada disponible en caché",
  );
  assert.match(
    catchBody,
    /status:\s*503/,
    "La respuesta de reserva offline debe indicar un estado de error de servicio (503)",
  );

  // El registro del service worker debe manejar el caso de navegador sin soporte
  // sin bloquear la carga de la app (debe retornar en vez de lanzar un error).
  const unsupportedBranchMatch = register.match(
    /if\s*\(\s*!\s*\(\s*["']serviceWorker["']\s+in\s+navigator\s*\)\s*\)\s*\{([\s\S]*?)\n\s*\}/,
  );
  assert.ok(
    unsupportedBranchMatch,
    "register-service-worker.ts debe comprobar 'serviceWorker' in navigator antes de registrar",
  );
  assert.match(
    unsupportedBranchMatch![1],
    /return;/,
    "Si el navegador no soporta service workers, la función debe retornar sin lanzar ni bloquear la carga",
  );
  assert.doesNotMatch(
    unsupportedBranchMatch![1],
    /throw /,
    "El caso sin soporte no debe lanzar una excepción que rompa la carga de la app",
  );

  // El registro real también debe manejar errores de red/registro sin romper la app.
  assert.match(
    register,
    /\.register\(\s*["']\/sw\.js["']\s*\)[\s\S]*?\.catch\(/,
    "El registro de /sw.js debe encadenar un .catch para no romper la app si falla",
  );

  console.log("offline.spec.ts: PASS");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
