import type { RemoteInspection } from "@/lib/storage/schema";
import { hasSameContent } from "@/lib/sync/conflict-policy";
import type { SyncOperation } from "@/lib/sync/queue";

/**
 * Lado servidor de la sincronización (en memoria, datos sintéticos).
 *
 * - Mismo clientId y misma versión con el mismo contenido: es un reintento,
 *   se responde 200 sin volver a guardar (idempotencia).
 * - La base del cliente coincide con la versión guardada: se acepta.
 * - Cualquier otro caso: 409 con la copia del servidor para que el cliente
 *   aplique la política de conflictos.
 */

export type ReceiveResult =
  | { status: 200; body: { status: "ok"; version: number; duplicate: boolean } }
  | { status: 409; body: { status: "conflict"; remote: RemoteInspection } }
  | { status: 400; body: { error: string } };

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isCount(value: unknown, min: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min;
}

/** Valida la forma de la operación antes de tocar el almacén. */
export function validateOperation(input: unknown): SyncOperation | null {
  if (!input || typeof input !== "object") return null;
  const operation = input as Partial<SyncOperation>;
  const record = operation.record as Partial<RemoteInspection> | undefined;

  if (!isText(operation.clientId) || !isCount(operation.version, 1)) return null;
  if (!isCount(operation.baseVersion, 0) || operation.baseVersion >= operation.version) return null;
  if (!record || typeof record !== "object") return null;
  if (record.clientId !== operation.clientId || record.version !== operation.version) return null;
  if (record.status !== "ok" && record.status !== "attention") return null;
  if (!isCount(record.findings, 0)) return null;

  const texts = [record.id, record.location, record.date, record.inspector, record.statusLabel, record.summary, record.updatedAt];
  if (!texts.every(isText)) return null;

  return operation as SyncOperation;
}

export function createSyncServer() {
  const records = new Map<string, RemoteInspection>();

  function receive(input: unknown): ReceiveResult {
    const operation = validateOperation(input);
    if (!operation) {
      return { status: 400, body: { error: "Operación de sincronización inválida." } };
    }

    const existing = records.get(operation.clientId);

    if (existing && existing.version === operation.version && hasSameContent(existing, operation.record)) {
      return { status: 200, body: { status: "ok", version: existing.version, duplicate: true } };
    }

    if (!existing || existing.version === operation.baseVersion) {
      records.set(operation.clientId, { ...operation.record });
      return { status: 200, body: { status: "ok", version: operation.version, duplicate: false } };
    }

    return { status: 409, body: { status: "conflict", remote: { ...existing } } };
  }

  return {
    receive,
    get: (clientId: string) => records.get(clientId),
    size: () => records.size,
  };
}

export type SyncServer = ReturnType<typeof createSyncServer>;
