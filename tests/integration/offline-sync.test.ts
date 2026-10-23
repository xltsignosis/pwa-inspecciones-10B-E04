import assert from "node:assert/strict";
import { test } from "node:test";
import { IDBFactory } from "fake-indexeddb";
import { INSPECTIONS_STORE_NAME, openInspectionDatabase, type StoredInspection } from "../../src/lib/storage/schema";
import { createFetchSender, enqueue, getAllRecords, getPending, syncPending } from "../../src/lib/sync/queue";
import { storedInspectionFixture } from "../fixtures/inspection";
import { remoteFixture } from "../fixtures/sync-remote";

test("guardar offline persiste la inspección al reabrir IndexedDB", async (t) => {
  const factory = new IDBFactory();
  const remote = remoteFixture();
  t.mock.method(globalThis, "fetch", remote.fetch);
  const record = storedInspectionFixture();
  await enqueue(record, factory);
  const result = await syncPending(createFetchSender(), factory);
  assert.equal(result.failed, 1);
  assert.equal(remote.server.size(), 0);

  // enqueue cierra su conexión. Se abre otra y se lee el almacén directamente.
  const reopened = await openInspectionDatabase(factory);
  try {
    const persisted = await new Promise<StoredInspection[]>((resolve, reject) => {
      const request = reopened.transaction(INSPECTIONS_STORE_NAME, "readonly")
        .objectStore(INSPECTIONS_STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    assert.deepEqual(persisted, [record]);
    assert.equal(persisted[0].syncStatus, "pending");
  } finally {
    reopened.close();
  }
  assert.equal((await getPending(factory)).length, 1);
});

test("reintentar tras perder la respuesta deja un solo registro remoto y local", async (t) => {
  const factory = new IDBFactory();
  const remote = remoteFixture();
  t.mock.method(globalThis, "fetch", remote.fetch);
  const record = storedInspectionFixture();
  const send = createFetchSender();
  await enqueue(record, factory);
  remote.connect();
  remote.loseResponseOnce();

  const first = await syncPending(send, factory);
  assert.equal(first.failed, 1);
  assert.equal(remote.server.size(), 1, "El servidor guardó aunque se perdió la respuesta");
  assert.deepEqual(await getPending(factory), [record]);

  const retry = await syncPending(send, factory);
  assert.equal(retry.synced, 1);
  assert.equal(remote.server.size(), 1, "El reintento no debe crear una segunda inspección");
  assert.equal(remote.attempts.length, 2, "Se enviaron realmente dos peticiones");
  assert.deepEqual(remote.attempts[1], remote.attempts[0], "Misma clave, versión y contenido en ambos envíos");
  assert.equal(remote.attempts[0].key, record.clientId);
  const local = await getAllRecords(factory);
  assert.equal(local.length, 1);
  assert.equal(local[0].clientId, record.clientId);
  assert.equal(local[0].syncStatus, "synced");
  assert.equal(local[0].summary, record.summary);
  assert.equal(remote.server.get(record.clientId)?.summary, record.summary);
  assert.deepEqual(await getPending(factory), []);

  assert.equal((await syncPending(send, factory)).attempted, 0);
  assert.equal(remote.attempts.length, 2, "Una operación confirmada deja de reenviarse");
});

test("guardar dos veces la misma clave local conserva un solo registro con el último contenido", async () => {
  const factory = new IDBFactory();
  const record = storedInspectionFixture();
  await enqueue(record, factory);
  const edited = { ...record, summary: "Contenido sintético actualizado" };
  await enqueue(edited, factory);
  assert.deepEqual(await getAllRecords(factory), [edited]);
});
