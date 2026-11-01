import type { RemoteInspection } from "@/lib/storage/schema";
import { hasSameContent } from "@/lib/sync/conflict-policy";
import type { SyncOperation } from "@/lib/sync/queue";
import { validateSyncOperation } from "@/lib/security/validation";

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

/** Valida la forma de la operación antes de tocar el almacén. */
export function validateOperation(input: unknown): SyncOperation | null {
  return validateSyncOperation(input);
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
