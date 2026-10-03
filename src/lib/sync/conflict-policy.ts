import type { Inspection } from "@/lib/data/inspections";
import type { RemoteInspection, StoredInspection } from "@/lib/storage/schema";

/**
 * Politica de conflictos: versiones con base comun + decision manual.
 *
 * Cada registro guarda `baseVersion`, la ultima version que el servidor
 * confirmo. Comparando esa base contra la version local y la remota se sabe
 * quien cambio desde la ultima sincronizacion:
 *
 * - solo cambio el dispositivo  -> se conserva la copia local y se reenvia;
 * - solo cambio el servidor     -> se adopta la copia remota;
 * - cambiaron ambos             -> conflicto: se guardan las dos copias y la
 *                                  persona decide con `resolveManually`.
 *
 * No se usa "el mas reciente gana" porque `updatedAt` viene del reloj de cada
 * dispositivo (puede estar adelantado o atrasado) y una inspeccion de
 * seguridad no debe sobrescribirse en silencio.
 */

/** Campos de negocio que se comparan para saber si dos copias son iguales. */
const CONTENT_FIELDS: (keyof Inspection)[] = [
  "id",
  "location",
  "date",
  "inspector",
  "status",
  "statusLabel",
  "findings",
  "summary"
];

export type ConflictOutcome = "unchanged" | "keep-local" | "take-remote" | "conflict";

export type ConflictDecision = {
  outcome: ConflictOutcome;
  /** Registro que debe quedar guardado en el dispositivo. */
  record: StoredInspection;
};

export function hasSameContent(a: Inspection, b: Inspection): boolean {
  return CONTENT_FIELDS.every((field) => a[field] === b[field]);
}

/** Copia del servidor convertida en registro local ya sincronizado. */
function fromRemote(remote: RemoteInspection): StoredInspection {
  return {
    ...remote,
    syncStatus: "synced",
    baseVersion: remote.version,
    remoteCopy: undefined
  };
}

/**
 * Decide que hacer cuando el servidor rechaza un envio porque su copia es
 * distinta a la base que conocia el dispositivo.
 */
export function resolveConflict(
  local: StoredInspection,
  remote: RemoteInspection
): ConflictDecision {
  if (local.clientId !== remote.clientId) {
    throw new Error("Solo se pueden comparar copias del mismo registro.");
  }

  if (hasSameContent(local, remote)) {
    return { outcome: "unchanged", record: fromRemote(remote) };
  }

  const base = local.baseVersion ?? 0;
  const localChanged = local.syncStatus !== "synced" && local.version > base;
  const remoteChanged = remote.version > base;

  if (localChanged && !remoteChanged) {
    return {
      outcome: "keep-local",
      record: {
        ...local,
        syncStatus: "pending",
        baseVersion: remote.version,
        version: Math.max(local.version, remote.version + 1)
      }
    };
  }

  if (!localChanged) {
    return { outcome: "take-remote", record: fromRemote(remote) };
  }

  // Ambos lados cambiaron: no se descarta ninguna copia.
  return {
    outcome: "conflict",
    record: { ...local, syncStatus: "conflict", remoteCopy: remote }
  };
}

/**
 * Aplica la decision de la persona sobre un registro en conflicto.
 * Si elige la copia local, se reenvia como una version nueva encima de la
 * remota; si elige la remota, queda sincronizada sin volver a enviarse.
 */
export function resolveManually(
  record: StoredInspection,
  choice: "local" | "remote",
  now: string = new Date().toISOString()
): StoredInspection {
  const remote = record.remoteCopy;

  if (record.syncStatus !== "conflict" || !remote) {
    throw new Error("El registro no tiene un conflicto pendiente.");
  }

  if (choice === "remote") {
    return fromRemote(remote);
  }

  return {
    ...record,
    syncStatus: "pending",
    baseVersion: remote.version,
    version: Math.max(record.version, remote.version) + 1,
    updatedAt: now,
    remoteCopy: undefined
  };
}

/**
 * Una confirmacion es vieja cuando corresponde a una version anterior a la
 * que hay en el dispositivo (la respuesta llego fuera de orden o hubo una
 * edicion mientras viajaba). En ese caso no se debe marcar como sincronizado.
 */
export function isStaleAck(record: StoredInspection, ackedVersion: number): boolean {
  return ackedVersion < record.version;
}
