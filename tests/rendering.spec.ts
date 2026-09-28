import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LoadingState } from "../src/components/loading-state";

const root = resolve(import.meta.dirname, "..");

async function run() {
  const [listSource, detailSource, loadingSource, apiSource] = await Promise.all([
    readFile(resolve(root, "src/app/inspecciones/page.tsx"), "utf8"),
    readFile(resolve(root, "src/app/inspecciones/[id]/page.tsx"), "utf8"),
    readFile(resolve(root, "src/app/inspecciones/loading.tsx"), "utf8"),
    readFile(resolve(root, "src/app/api/inspecciones/[id]/route.ts"), "utf8"),
  ]);

  // La ruta de listado se resuelve en el servidor y entrega datos en el HTML.
  assert.doesNotMatch(
    listSource,
    /^\s*["']use client["']/,
    "El listado no debe convertirse en Client Component",
  );
  assert.match(
    listSource,
    /import\s*\{\s*inspections\s*\}/,
    "El listado debe obtener las inspecciones sintéticas en el servidor",
  );

  assert.match(listSource, /data\.map\(/, "El listado debe renderizar los datos obtenidos");
  assert.match(
    listSource,
    /href=\{`\/inspecciones\/\$\{inspection\.id\}`\}/,
    "El listado debe enlazar al detalle de cada inspección",
  );

  // loading.tsx debe delegar el estado de espera al componente compartido.
  assert.match(
    loadingSource,
    /<LoadingState\s+status=["']loading["']\s*\/>/,
    "La ruta SSR debe ofrecer un estado de carga mediante LoadingState",
  );

  // El detalle es CSR: inicia estable en loading y solicita los datos al montar.
  assert.match(
    detailSource,
    /^\s*["']use client["']/,
    "El detalle debe declararse como Client Component",
  );
  assert.match(detailSource, /useEffect\s*\(/, "El detalle debe cargar los datos en un efecto");
  assert.match(
    detailSource,
    /useState<DetailState>\(\{\s*status:\s*["']loading["']\s*\}\)/,
    "El primer render del detalle debe ser loading para evitar hydration mismatch",
  );
  assert.match(
    detailSource,
    /fetch\(\s*`\/api\/inspecciones\/\$\{encodeURIComponent\(id\)\}`/,
    "El detalle debe solicitar su información al endpoint de inspecciones",
  );
  assert.match(detailSource, /response\.status\s*===\s*404/, "El detalle debe manejar el caso no encontrado");
  assert.match(detailSource, /AbortController/, "El efecto debe cancelar peticiones obsoletas al desmontarse");
  assert.match(detailSource, /Reintentar/i, "El error recuperable debe ofrecer un reintento");
  assert.match(
    detailSource,
    /setAttempt\(\(n\)\s*=>\s*n\s*\+\s*1\)/,
    "El botón de reintento debe disparar una petición nueva",
  );
  const detailCode = detailSource
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(
    detailCode,
    /Math\.random\(|Date\.now\(/,
    "El render inicial no debe usar valores no deterministas",
  );

  // El endpoint distingue un registro válido de uno inexistente.
  assert.match(apiSource, /inspections\.find\(/, "La API debe buscar la inspección por id");
  assert.match(apiSource, /status:\s*404/, "La API debe responder 404 cuando el id no existe");

  // El componente compartido comunica cada estado a tecnologías de asistencia.
  const loadingHtml = renderToStaticMarkup(createElement(LoadingState, { status: "loading" }));
  assert.match(loadingHtml, /role="status"/, "La carga debe anunciarse como estado");
  assert.match(loadingHtml, /aria-busy="true"/, "La carga debe indicar que la región está ocupada");

  const emptyHtml = renderToStaticMarkup(createElement(LoadingState, { status: "empty" }));
  assert.match(emptyHtml, /No hay inspecciones registradas/, "El estado vacío debe ser comprensible");

  const errorHtml = renderToStaticMarkup(
    createElement(LoadingState, { status: "error", message: "Fallo sintético de prueba" }),
  );
  assert.match(errorHtml, /role="alert"/, "El error debe anunciarse como alerta");
  assert.match(errorHtml, /aria-live="assertive"/, "El error debe notificarse inmediatamente");
  assert.match(errorHtml, /Fallo sintético de prueba/, "El componente debe mostrar el detalle recibido");

  console.log("rendering.spec.ts: PASS");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
