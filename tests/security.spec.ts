import assert from "node:assert/strict";
import { test } from "node:test";
import { IDBFactory } from "fake-indexeddb";
import { isValidInspection, validateSyncOperation, validateSyncResponse } from "../src/lib/security/validation";
import { createNonce, contentSecurityPolicy } from "../src/lib/security/headers";
import { assertNoPublicEnvironment } from "../src/lib/security/environment.mjs";
import { credentialIndicators, scanClientFiles } from "../scripts/check-client-secrets.mjs";
import { POST } from "../src/app/api/inspecciones/sync/route";
import { createSyncServer } from "../src/lib/sync/server-store";
import { createFetchSender, enqueue, getAllRecords, syncPending, toOperation } from "../src/lib/sync/queue";
import { inspectionFixture, storedInspectionFixture } from "./fixtures/inspection";

test("acepta el contrato válido y los límites documentados", () => {
  assert.equal(isValidInspection(inspectionFixture({ location: "x".repeat(200), inspector: "x".repeat(120), summary: "x".repeat(2000), statusLabel: "x".repeat(80), date: "2024-02-29", findings: 10000 })), true);
  assert.ok(validateSyncOperation(toOperation(storedInspectionFixture())));
});

const invalidInspections: [string, unknown][] = [
  ["null", null], ["arreglo", []],
  ["campo extra", { ...inspectionFixture(), admin: true }],
  ["campo ausente", { ...inspectionFixture(), summary: undefined }],
  ["objeto anidado", { ...inspectionFixture(), location: { name: "Laboratorio sintético" } }],
  ["tipo numérico incorrecto", { ...inspectionFixture(), findings: "1" }],
  ["fecha imposible", inspectionFixture({ date: "2026-02-30" })],
  ["año cero", inspectionFixture({ date: "0000-01-01" })],
  ["texto vacío", inspectionFixture({ inspector: "  " })],
  ["control ASCII", inspectionFixture({ summary: "prueba\u0000" })],
  ["identificador inválido", inspectionFixture({ id: "../otra" })],
  ["estado desconocido", { ...inspectionFixture(), status: "admin" }],
  ...([ ["location", 201], ["inspector", 121], ["summary", 2001], ["statusLabel", 81] ] as const)
    .map(([field, limit]): [string, unknown] => [`longitud ${field}`, { ...inspectionFixture(), [field]: "x".repeat(limit) }]),
  ...[-1, 1.5, 10001, NaN, Infinity].map((findings): [string, unknown] => [`hallazgos ${findings}`, inspectionFixture({ findings })]),
];
for (const [name, input] of invalidInspections) {
  test(`rechaza inspección: ${name}`, () => assert.equal(isValidInspection(input), false));
}

test("rechaza prototipos, símbolos y accesores sin ejecutar el getter", () => {
  assert.equal(isValidInspection(Object.assign(Object.create({ admin: true }), inspectionFixture())), false);
  assert.equal(isValidInspection({ ...inspectionFixture(), [Symbol("extra")]: true }), false);
  let calls = 0;
  const input = { ...inspectionFixture() };
  Object.defineProperty(input, "summary", { enumerable: true, get() { calls++; return "sintético"; } });
  assert.equal(isValidInspection(input), false);
  assert.equal(calls, 0);
});

test("servidor rechaza estructuras y versiones manipuladas sin modificar datos", () => {
  const server = createSyncServer();
  const op = toOperation(storedInspectionFixture());
  const inputs = [
    { ...op, extra: true }, { ...op, version: 0 }, { ...op, version: 1.5 },
    { ...op, baseVersion: -1 }, { ...op, baseVersion: op.version },
    { ...op, clientId: "otra-identidad" },
    { ...op, record: { ...op.record, version: 2 } },
    { ...op, record: { ...op.record, updatedAt: "2026-02-30T00:00:00.000Z" } },
    { ...op, record: { ...op.record, extra: true } },
  ];
  for (const input of inputs) {
    assert.equal(server.receive(input).status, 400);
    assert.equal(server.size(), 0);
  }
  assert.equal(server.receive(op).status, 200);
  assert.equal(server.receive({ ...op, record: { ...op.record, findings: -1 } }).status, 400);
  assert.deepEqual(server.get(op.clientId), op.record);
});

test("endpoint aplica 400, 413 y 415 sobre peticiones reales", async () => {
  const request = (body: BodyInit, headers: HeadersInit = { "content-type": "application/json" }) =>
    new Request("http://localhost/api/inspecciones/sync", { method: "POST", headers, body });
  const cases: [Request, number][] = [
    [request("{}", { "content-type": "text/plain" }), 415],
    [request("{"), 400], [request(new Uint8Array([0xff])), 400],
    [request(JSON.stringify({ unexpected: true })), 400],
    [request('"' + "x".repeat(32769) + '"'), 413],
    [request("{}", { "content-type": "application/json", "content-length": "32769" }), 413],
  ];
  for (const [input, status] of cases) {
    const response = await POST(input);
    assert.equal(response.status, status);
    assert.equal(typeof (await response.json()).error, "string");
  }
  const op = toOperation(storedInspectionFixture());
  assert.equal((await POST(request(JSON.stringify(op)))).status, 200);
});

test("límite HTTP cuenta bytes UTF-8 y no confía en Content-Length", async () => {
  const response = await POST(new Request("http://localhost/api/inspecciones/sync", {
    method: "POST", headers: { "content-type": "application/json", "content-length": "2" },
    body: JSON.stringify({ text: "á".repeat(17000) }),
  }));
  assert.equal(response.status, 413);
});

test("respuestas manipuladas conservan íntegro el registro pendiente", async (t) => {
  const record = storedInspectionFixture();
  const op = toOperation(record);
  const cases: [number, unknown][] = [
    [200, { status: "ok", version: 2, duplicate: false }],
    [200, { status: "ok", version: 1, duplicate: false, extra: true }],
    [200, { status: "ok", version: 1, duplicate: "false" }],
    [409, { status: "conflict", remote: { ...op.record, clientId: "otra-identidad" } }],
    [409, { status: "conflict", remote: { ...op.record, extra: true } }],
  ];
  for (const [status, body] of cases) {
    const factory = new IDBFactory();
    await enqueue(record, factory);
    t.mock.method(globalThis, "fetch", async () => Response.json(body, { status }));
    const result = await syncPending(createFetchSender(), factory);
    assert.equal(result.failed, 1);
    assert.deepEqual(await getAllRecords(factory), [record]);
    t.mock.restoreAll();
  }
  assert.deepEqual(validateSyncResponse({ status: "ok", version: 1, duplicate: false }, op, false), { status: "ok", version: 1 });
});

test("CSP de producción restringe orígenes y genera nonces diferentes", () => {
  const first = createNonce();
  assert.notEqual(createNonce(), first);
  assert.equal(Buffer.from(first, "base64").length, 16);
  const csp = contentSecurityPolicy(first);
  assert.ok(csp.includes(`script-src 'self' 'nonce-${first}'`));
  assert.ok(csp.includes("connect-src 'self';"));
  assert.ok(csp.includes("frame-ancestors 'none'"));
  assert.ok(csp.includes("script-src-attr 'none'"));
  assert.doesNotMatch(csp, /unsafe-eval|https?:|\*/);
  assert.throws(() => contentSecurityPolicy("nonce manipulado"));
  assert.match(contentSecurityPolicy(first, true), /unsafe-eval/);
});

test("configuración pública se rechaza sin revelar su valor", () => {
  assert.doesNotThrow(() => assertNoPublicEnvironment({ NODE_ENV: "production" }));
  const synthetic = "valor-sintetico-no-publicar";
  assert.throws(() => assertNoPublicEnvironment({ NEXT_PUBLIC_TEST: synthetic }), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.ok(!error.message.includes(synthetic));
    return true;
  });
});

test("detector identifica credenciales sintéticas y evita marcar palabras documentales", () => {
  assert.deepEqual(credentialIndicators("Evitar secretos, tokens y password en documentación."), []);
  assert.deepEqual(credentialIndicators("ghp_" + "x".repeat(36)), ["github-credential"]);
  assert.deepEqual(credentialIndicators("AKIA" + "X".repeat(16)), ["aws-access-key"]);
  assert.deepEqual(credentialIndicators("-----BEGIN " + "PRIVATE KEY-----"), ["private-key"]);
  assert.deepEqual(credentialIndicators('api_key = "' + "x".repeat(20) + '"'), ["literal-credential"]);
  assert.deepEqual(scanClientFiles(process.cwd(), ["src", "public"]), []);
});
