import assert from "node:assert/strict";
import { test } from "node:test";
import { toOperation } from "../../src/lib/sync/queue";
import { createSyncServer } from "../../src/lib/sync/server-store";
import { storedInspectionFixture } from "../fixtures/inspection";

test("preparar un reintento conserva clientId, versión y contenido", () => {
  const record = storedInspectionFixture();
  const before = structuredClone(record);
  const first = toOperation(record);
  const retry = toOperation(record);
  assert.equal(first.clientId, record.clientId);
  assert.equal(retry.clientId, record.clientId);
  assert.equal(retry.record.clientId, record.clientId);
  assert.equal(retry.version, record.version);
  assert.deepEqual(retry, first);
  assert.deepEqual(record, before, "Preparar el envío no modifica el registro local");
  assert.equal("syncStatus" in first.record, false);
});

test("la misma operación se reconoce como duplicada sin insertar otra copia", () => {
  const server = createSyncServer();
  const operation = toOperation(storedInspectionFixture());
  assert.deepEqual(server.receive(operation), {
    status: 200, body: { status: "ok", version: 1, duplicate: false },
  });
  assert.deepEqual(server.receive(structuredClone(operation)), {
    status: 200, body: { status: "ok", version: 1, duplicate: true },
  });
  assert.equal(server.size(), 1);
  assert.deepEqual(server.get(operation.clientId), operation.record);
});

test("una identidad inválida se rechaza sin crear registros", () => {
  const server = createSyncServer();
  const operation = toOperation(storedInspectionFixture());
  assert.equal(server.receive({ ...operation, clientId: "" }).status, 400);
  assert.equal(server.receive({ ...operation, record: { ...operation.record, clientId: "otra" } }).status, 400);
  assert.equal(server.size(), 0);
});
