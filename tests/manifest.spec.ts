import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

async function run() {
  const manifestRaw = await readFile(resolve(root, "public/manifest.webmanifest"), "utf8");
  const manifest = JSON.parse(manifestRaw);

  assert.ok(manifest.name, "El manifest debe tener 'name'");
  assert.ok(manifest.short_name, "El manifest debe tener 'short_name'");
  assert.equal(manifest.display, "standalone");
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, "Debe tener al menos 2 iconos");

  console.log("manifest.spec.ts: PASS");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});