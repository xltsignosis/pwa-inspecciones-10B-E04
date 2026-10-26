import assert from "node:assert/strict";
import { createSyncServer } from "../../src/lib/sync/server-store";
import type { SyncOperation } from "../../src/lib/sync/queue";

/** Sustituye solo el transporte HTTP; la cola y el servidor ejecutan su código real. */
export function remoteFixture() {
  const server = createSyncServer();
  const attempts: { body: SyncOperation; key: string | null }[] = [];
  let online = false;
  let loseNextResponse = false;

  const fetch: typeof globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/inspecciones/sync");
    assert.equal(options?.method, "POST");
    if (!online) throw new TypeError("Failed to fetch: fixture offline");
    const body = JSON.parse(String(options?.body)) as SyncOperation;
    const headers = new Headers(options?.headers);
    const key = headers.get("Idempotency-Key");
    assert.equal(headers.get("Content-Type"), "application/json");
    assert.equal(key, body.clientId, "La cabecera y el cuerpo identifican la misma operación");
    attempts.push({ body, key });
    const result = server.receive(body);
    if (loseNextResponse) {
      loseNextResponse = false;
      throw new TypeError("Fixture: respuesta perdida después de guardar");
    }
    return Response.json(result.body, { status: result.status });
  };

  return {
    server,
    attempts,
    fetch,
    connect: () => { online = true; },
    loseResponseOnce: () => { loseNextResponse = true; },
  };
}
