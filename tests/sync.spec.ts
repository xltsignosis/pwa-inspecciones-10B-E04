import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { inspections } from "../src/lib/data/inspections";
import {
  createStoredInspection,
  openInspectionDatabase,
  INSPECTIONS_STORE_NAME,
  type RemoteInspection,
  type StoredInspection,
} from "../src/lib/storage/schema";
import {
  enqueue,
  getAllRecords,
  getPending,
  saveLocalEdit,
  syncPending,
  toOperation,
  type SendOperation,
  type SyncOperation,
  type SyncResponse,
} from "../src/lib/sync/queue";
import { isStaleAck, resolveConflict, resolveManually } from "../src/lib/sync/conflict-policy";
import { createSyncServer, type SyncServer } from "../src/lib/sync/server-store";

// Cada caso usa su propia IndexedDB en memoria (fake-indexeddb) y su propio
// servidor sintético, así que el orden de ejecución no afecta los resultados.

const T0 = "2026-09-01T10:00:00.000Z";
const T1 = "2026-09-01T11:00:00.000Z";
const T2 = "2026-09-01T12:00:00.000Z";

function sample(index: number, clientId: string): StoredInspection {
  return createStoredInspection(inspections[index], { clientId, updatedAt: T0 });
}

/** Simula la red: copia el payload como lo haría JSON y lo entrega al servidor. */
function networkTo(server: SyncServer): SendOperation {
  return async (operation) => {
    const result = server.receive(JSON.parse(JSON.stringify(operation)));
    if (result.status === 200) return { status: "ok", version: result.body.version };
    if (result.status === 409) return { status: "conflict", remote: result.body.remote };
    throw new Error(`HTTP ${result.status}`);
  };
}

const offline: SendOperation = async () => {
  throw new TypeError("Failed to fetch");
};

/** Edición hecha por otro dispositivo directamente en el servidor. */
function remoteEdit(server: SyncServer, clientId: string, changes: Partial<RemoteInspection>) {
  const current = server.get(clientId);
  assert.ok(current, "El registro debe existir en el servidor");
  const record = { ...current, ...changes, version: current.version + 1, updatedAt: T2 };
  const result = server.receive({ clientId, version: record.version, baseVersion: current.version, record });
  assert.equal(result.status, 200);
}

async function recordOf(factory: IDBFactory, clientId: string) {
  const all = await getAllRecords(factory);
  return all.find((record) => record.clientId === clientId);
}

const cases: [string, () => Promise<void>][] = [];
const test = (name: string, fn: () => Promise<void>) => cases.push([name, fn]);

test("la misma clave de idempotencia enviada dos veces no duplica", async () => {
  const factory = new IDBFactory();
  const server = createSyncServer();
  const record = sample(0, "client-idem");

  // En el dispositivo: encolar dos veces el mismo registro deja uno solo.
  await enqueue(record, factory);
  await enqueue(record, factory);
  assert.equal((await getAllRecords(factory)).length, 1);

  // En el servidor: el mismo envío dos veces guarda una sola copia.
  const operation = toOperation(record);
  const first = server.receive(operation);
  const second = server.receive(operation);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(first.status === 200 && first.body.duplicate, false);
  assert.equal(second.status === 200 && second.body.duplicate, true);
  assert.equal(server.size(), 1);
});

test("si la respuesta se pierde, el reintento no crea otro registro", async () => {
  const factory = new IDBFactory();
  const server = createSyncServer();
  await enqueue(sample(1, "client-lost-ack"), factory);

  // El servidor procesa la operación, pero la respuesta nunca llega (timeout).
  const lostResponse: SendOperation = async (operation) => {
    await networkTo(server)(operation);
    throw new Error("timeout");
  };
  const firstTry = await syncPending(lostResponse, factory);
  assert.equal(firstTry.failed, 1);
  assert.equal((await recordOf(factory, "client-lost-ack"))?.syncStatus, "pending");

  const retry = await syncPending(networkTo(server), factory);
  assert.equal(retry.synced, 1);
  assert.equal(server.size(), 1, "El reintento con el mismo clientId no debe duplicar");
  assert.equal((await recordOf(factory, "client-lost-ack"))?.syncStatus, "synced");
});

test("una operación fallida por falta de red permanece en la cola", async () => {
  const factory = new IDBFactory();
  const server = createSyncServer();
  const record = sample(2, "client-offline");
  await enqueue(record, factory);

  const summary = await syncPending(offline, factory);
  assert.deepEqual(summary, { attempted: 1, synced: 0, conflicts: 0, failed: 1, requeued: 0 });

  const pending = await getPending(factory);
  assert.equal(pending.length, 1);
  assert.equal(pending[0].clientId, record.clientId, "El reintento conserva la misma clave");
  assert.equal(pending[0].version, record.version);
  assert.equal(server.size(), 0);

  // Al recuperar la red se sincroniza y sale de la cola.
  const online = await syncPending(networkTo(server), factory);
  assert.equal(online.synced, 1);
  assert.equal((await getPending(factory)).length, 0);
  assert.equal(server.get(record.clientId)?.summary, record.summary);
});

test("cambio local y remoto simultáneo queda en conflicto sin perder ninguna copia", async () => {
  const factory = new IDBFactory();
  const server = createSyncServer();
  await enqueue(sample(0, "client-conflict"), factory);
  await syncPending(networkTo(server), factory);

  // Sin red, el dispositivo edita; mientras, otro dispositivo edita en el servidor.
  await saveLocalEdit("client-conflict", { findings: 3, summary: "Cambio local sin conexión" }, factory, T1);
  remoteEdit(server, "client-conflict", { findings: 1, summary: "Cambio remoto" });

  const summary = await syncPending(networkTo(server), factory);
  assert.equal(summary.conflicts, 1);

  const stored = await recordOf(factory, "client-conflict");
  assert.equal(stored?.syncStatus, "conflict");
  assert.equal(stored?.summary, "Cambio local sin conexión", "La copia local se conserva");
  assert.equal(stored?.remoteCopy?.summary, "Cambio remoto", "La copia remota se conserva");
  assert.equal(server.get("client-conflict")?.summary, "Cambio remoto", "El servidor no se sobrescribe");
  assert.equal((await getPending(factory)).length, 0, "Un conflicto no se reenvía solo");

  // La persona elige la copia local: se reenvía encima de la remota.
  await enqueue(resolveManually(stored!, "local", T2), factory);
  const resolved = await syncPending(networkTo(server), factory);
  assert.equal(resolved.synced, 1);
  assert.equal(server.get("client-conflict")?.summary, "Cambio local sin conexión");
  assert.equal((await recordOf(factory, "client-conflict"))?.syncStatus, "synced");
});

test("la política distingue cambio solo local, solo remoto y contenido igual", async () => {
  const base = { ...sample(1, "client-policy"), version: 2, baseVersion: 2, syncStatus: "synced" as const };
  const { syncStatus, baseVersion, remoteCopy, ...remoteBase } = base;

  const localOnly = { ...base, version: 3, syncStatus: "pending" as const, findings: 5 };
  assert.equal(resolveConflict(localOnly, remoteBase).outcome, "keep-local");

  const remoteOnly = { ...remoteBase, version: 3, findings: 7 };
  const takeRemote = resolveConflict(base, remoteOnly);
  assert.equal(takeRemote.outcome, "take-remote");
  assert.equal(takeRemote.record.findings, 7);
  assert.equal(takeRemote.record.syncStatus, "synced");

  const same = resolveConflict({ ...localOnly, findings: 7 }, remoteOnly);
  assert.equal(same.outcome, "unchanged");

  // Aunque la copia remota tenga una fecha más reciente, no gana en silencio.
  const both = resolveConflict(localOnly, { ...remoteOnly, updatedAt: "2030-01-01T00:00:00.000Z" });
  assert.equal(both.outcome, "conflict");
  assert.equal(both.record.findings, 5);

  assert.equal(resolveManually(both.record, "remote").findings, 7);
  assert.throws(() => resolveManually(base, "local"), /conflicto pendiente/);
});

test("la cola sobrevive a cerrar la pestaña (se relee desde IndexedDB)", async () => {
  const factory = new IDBFactory();
  await enqueue(sample(0, "client-restart-a"), factory);
  await enqueue(sample(1, "client-restart-b"), factory);
  await syncPending(offline, factory);

  // "Reinicio": nada de la cola vive en memoria; se abre una conexión nueva
  // directamente sobre la base y se leen los registros guardados.
  const db = await openInspectionDatabase(factory);
  const persisted = await new Promise<StoredInspection[]>((resolve, reject) => {
    const request = db.transaction(INSPECTIONS_STORE_NAME, "readonly").objectStore(INSPECTIONS_STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as StoredInspection[]);
    request.onerror = () => reject(request.error);
  });
  db.close();

  assert.deepEqual(persisted.map((record) => record.clientId).sort(), ["client-restart-a", "client-restart-b"]);
  assert.ok(persisted.every((record) => record.syncStatus === "pending"));

  const server = createSyncServer();
  const summary = await syncPending(networkTo(server), factory);
  assert.equal(summary.synced, 2);
  assert.equal(server.size(), 2);
});

test("una respuesta vieja que llega tarde no marca como sincronizada una edición nueva", async () => {
  const factory = new IDBFactory();
  const server = createSyncServer();
  await enqueue(sample(2, "client-late"), factory);

  // El envío de la versión 1 queda en vuelo; mientras, se edita a la versión 2.
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  const slow: SendOperation = async (operation) => {
    const response = await networkTo(server)(operation);
    await gate;
    return response;
  };

  const inFlight = syncPending(slow, factory);
  await saveLocalEdit("client-late", { summary: "Edición hecha mientras viajaba la v1" }, factory, T1);
  release();

  const summary = await inFlight;
  assert.equal(summary.requeued, 1);
  const afterLateAck = await recordOf(factory, "client-late");
  assert.equal(afterLateAck?.syncStatus, "pending", "La v2 no se pierde");
  assert.equal(afterLateAck?.version, 2);
  assert.equal(isStaleAck(afterLateAck!, 1), true);

  const next = await syncPending(networkTo(server), factory);
  assert.equal(next.synced, 1);
  assert.equal(server.get("client-late")?.summary, "Edición hecha mientras viajaba la v1");
  assert.equal(server.get("client-late")?.version, 2);
});

test("respuestas en orden distinto al envío se aplican a su propio registro", async () => {
  const factory = new IDBFactory();
  const server = createSyncServer();
  await enqueue(sample(0, "client-order-a"), factory);
  await enqueue(sample(1, "client-order-b"), factory);

  const releases = new Map<string, () => void>();
  const sentOrder: string[] = [];
  const reversed: SendOperation = (operation: SyncOperation) =>
    new Promise<SyncResponse>((resolve, reject) => {
      sentOrder.push(operation.clientId);
      releases.set(operation.clientId, () => networkTo(server)(operation).then(resolve, reject));
    });

  const run = syncPending(reversed, factory);
  while (releases.size < 2) await new Promise((resolve) => setTimeout(resolve, 0));

  // Responde primero el último que se envió.
  releases.get(sentOrder[1])!();
  await new Promise((resolve) => setTimeout(resolve, 5));
  releases.get(sentOrder[0])!();

  const summary = await run;
  assert.equal(summary.synced, 2);
  const records = await getAllRecords(factory);
  assert.ok(records.every((record) => record.syncStatus === "synced" && record.baseVersion === 1));
  assert.equal(server.get("client-order-a")?.location, inspections[0].location);
  assert.equal(server.get("client-order-b")?.location, inspections[1].location);
});

test("el servidor rechaza operaciones inválidas sin guardarlas", async () => {
  const server = createSyncServer();
  const valid = toOperation(sample(0, "client-valid"));

  assert.equal(server.receive(null).status, 400);
  assert.equal(server.receive({ ...valid, clientId: "" }).status, 400);
  assert.equal(server.receive({ ...valid, baseVersion: valid.version }).status, 400);
  assert.equal(server.receive({ ...valid, record: { ...valid.record, findings: -1 } }).status, 400);
  assert.equal(server.receive({ ...valid, record: { ...valid.record, clientId: "otro" } }).status, 400);
  assert.equal(server.size(), 0);
  assert.equal(server.receive(valid).status, 200);
});

async function run() {
  for (const [name, fn] of cases) {
    await fn();
    console.log(`  ok - ${name}`);
  }
  console.log(`sync.spec.ts: PASS (${cases.length} casos)`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
