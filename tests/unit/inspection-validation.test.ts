import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidInspection } from "../../src/lib/validation/inspection";
import { createSyncServer } from "../../src/lib/sync/server-store";
import { toOperation } from "../../src/lib/sync/queue";
import { inspectionFixture, storedInspectionFixture } from "../fixtures/inspection";

test("captura válida: acepta cero hallazgos y un entero positivo", () => {
  assert.equal(isValidInspection(inspectionFixture()), true);
  assert.equal(isValidInspection(inspectionFixture({ findings: 2, status: "attention" })), true);
});

for (const [name, input] of [
  ["sin datos", null],
  ["ubicación vacía", inspectionFixture({ location: "" })],
  ["ubicación con espacios", inspectionFixture({ location: "   " })],
  ["inspector ausente", { ...inspectionFixture(), inspector: undefined }],
  ["hallazgos negativos", inspectionFixture({ findings: -1 })],
  ["hallazgos fraccionarios", inspectionFixture({ findings: 1.5 })],
  ["hallazgos como texto", { ...inspectionFixture(), findings: "2" }],
  ["estado desconocido", { ...inspectionFixture(), status: "otro" }],
] as const) {
  test(`captura inválida: rechaza ${name}`, () => {
    assert.equal(isValidInspection(input), false);
  });
}

test("la entrada real del servidor aplica la regla de captura antes de guardar", () => {
  const server = createSyncServer();
  const operation = toOperation(storedInspectionFixture());
  assert.equal(server.receive({ ...operation, record: { ...operation.record, location: " " } }).status, 400);
  assert.equal(server.size(), 0);
  assert.equal(server.receive(operation).status, 200);
  assert.equal(server.size(), 1);
});
