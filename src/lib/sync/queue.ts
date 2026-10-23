import type { Inspection } from "@/lib/data/inspections";
import {
  INSPECTIONS_STORE_NAME,
  INSPECTIONS_INDEXES,
  openInspectionDatabase,
  type RemoteInspection,
  type StoredInspection,
} from "@/lib/storage/schema";
import {
  isStaleAck,
  resolveConflict,
  type ConflictOutcome,
} from "@/lib/sync/conflict-policy";

/** Lo que viaja al servidor. `clientId` es la clave de idempotencia. */
export type SyncOperation = {
  clientId: string;
  version: number;
  baseVersion: number;
  record: RemoteInspection;
};

export type SyncResponse =
  | { status: "ok"; version: number }
  | { status: "conflict"; remote: RemoteInspection };

/** Envía una operación. Debe lanzar un error si no hubo respuesta válida. */
export type SendOperation = (operation: SyncOperation) => Promise<SyncResponse>;

export type SyncSummary = {
  attempted: number;
  synced: number;
  conflicts: number;
  /** Envíos sin respuesta (sin red, timeout, error del servidor). */
  failed: number;
  /** Registros que siguen pendientes porque cambiaron mientras se enviaban. */
  requeued: number;
};

/**
 * Guarda (o actualiza) una inspección en el almacén local.
 * Como `clientId` es la keyPath del object store, volver a llamar con la
 * misma inspección (mismo clientId) sobrescribe el registro existente en
 * vez de duplicarlo: esto es lo que garantiza la idempotencia al reintentar.
 */
export async function enqueue(inspection: StoredInspection, factory?: IDBFactory): Promise<void> {
  const db = await openInspectionDatabase(factory);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(INSPECTIONS_STORE_NAME, "readwrite");
    tx.objectStore(INSPECTIONS_STORE_NAME).put(inspection);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("No se pudo encolar la inspección."));
  });
  db.close();
}

/**
 * Devuelve todas las inspecciones pendientes de sincronizar, leídas desde
 * IndexedDB mediante el índice by-sync-status que define schema.ts.
 */
export async function getPending(factory?: IDBFactory): Promise<StoredInspection[]> {
  const db = await openInspectionDatabase(factory);
  const result = await new Promise<StoredInspection[]>((resolve, reject) => {
    const tx = db.transaction(INSPECTIONS_STORE_NAME, "readonly");
    const index = tx.objectStore(INSPECTIONS_STORE_NAME).index(INSPECTIONS_INDEXES.syncStatus);
    const request = index.getAll("pending");
    request.onsuccess = () => resolve(request.result as StoredInspection[]);
    request.onerror = () => reject(request.error ?? new Error("No se pudo leer la cola pendiente."));
  });
  db.close();
  return result;
}

/** Devuelve todos los registros locales, en cualquier estado. */
export async function getAllRecords(factory?: IDBFactory): Promise<StoredInspection[]> {
  const db = await openInspectionDatabase(factory);
  const result = await new Promise<StoredInspection[]>((resolve, reject) => {
    const tx = db.transaction(INSPECTIONS_STORE_NAME, "readonly");
    const request = tx.objectStore(INSPECTIONS_STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as StoredInspection[]);
    request.onerror = () => reject(request.error ?? new Error("No se pudieron leer las inspecciones."));
  });
  db.close();
  return result;
}

/**
 * Lee, modifica y guarda un registro dentro de UNA sola transacción, para que
 * una respuesta del servidor y una edición local no se pisen entre sí.
 * Si `change` devuelve undefined no se escribe nada.
 */
async function updateRecord(
  clientId: string,
  change: (record: StoredInspection) => StoredInspection | undefined,
  factory?: IDBFactory
): Promise<StoredInspection | undefined> {
  const db = await openInspectionDatabase(factory);
  try {
    return await new Promise<StoredInspection | undefined>((resolve, reject) => {
      const tx = db.transaction(INSPECTIONS_STORE_NAME, "readwrite");
      const store = tx.objectStore(INSPECTIONS_STORE_NAME);
      let written: StoredInspection | undefined;
      const getRequest = store.get(clientId);
      getRequest.onsuccess = () => {
        const record = getRequest.result as StoredInspection | undefined;
        if (!record) return;
        written = change(record);
        if (written) store.put(written);
      };
      tx.oncomplete = () => resolve(written);
      tx.onerror = () => reject(tx.error ?? new Error("No se pudo actualizar el registro."));
      tx.onabort = () => reject(tx.error ?? new Error("Se canceló la actualización del registro."));
    });
  } finally {
    db.close();
  }
}

/**
 * Registra una edición hecha en el dispositivo: sube la versión y deja el
 * registro pendiente. Conserva el mismo clientId.
 */
export async function saveLocalEdit(
  clientId: string,
  changes: Partial<Inspection>,
  factory?: IDBFactory,
  now: string = new Date().toISOString()
): Promise<StoredInspection> {
  const record = await updateRecord(
    clientId,
    (current) => ({
      ...current,
      ...changes,
      version: current.version + 1,
      updatedAt: now,
      syncStatus: current.syncStatus === "conflict" ? "conflict" : "pending",
    }),
    factory
  );
  if (!record) throw new Error("No existe la inspección que se quiere editar.");
  return record;
}

/**
 * Marca una inspección como sincronizada. Esto SOLO debe llamarse tras una
 * confirmación real del servidor: un timeout no prueba que la operación no
 * se haya ejecutado, así que nunca se usa este método ante un simple fallo
 * de red o expiración de tiempo.
 *
 * `ackedVersion` es la versión que confirmó el servidor. Si el registro ya
 * tiene una versión mayor (respuesta fuera de orden o edición mientras
 * viajaba), se queda pendiente para no perder el cambio nuevo.
 * Devuelve true solo si quedó marcado como sincronizado.
 */
export async function markSynced(
  clientId: string,
  ackedVersion?: number,
  factory?: IDBFactory
): Promise<boolean> {
  let synced = false;
  await updateRecord(
    clientId,
    (record) => {
      const version = ackedVersion ?? record.version;
      if (isStaleAck(record, version)) {
        return { ...record, baseVersion: Math.max(record.baseVersion ?? 0, version) };
      }
      synced = true;
      return { ...record, syncStatus: "synced", baseVersion: version, remoteCopy: undefined };
    },
    factory
  );
  return synced;
}

/**
 * Marca un registro con conflicto, para que conflict-policy.ts decida
 * cómo resolverlo. Si se recibe la copia remota se conserva junto a la local.
 */
export async function markConflict(
  clientId: string,
  remote?: RemoteInspection,
  factory?: IDBFactory
): Promise<void> {
  await updateRecord(
    clientId,
    (record) => ({ ...record, syncStatus: "conflict", remoteCopy: remote ?? record.remoteCopy }),
    factory
  );
}

/** Aplica la política de conflictos a la copia que devolvió el servidor. */
async function applyRemote(
  clientId: string,
  remote: RemoteInspection,
  factory?: IDBFactory
): Promise<ConflictOutcome | undefined> {
  let outcome: ConflictOutcome | undefined;
  await updateRecord(
    clientId,
    (local) => {
      const decision = resolveConflict(local, remote);
      outcome = decision.outcome;
      return decision.record;
    },
    factory
  );
  return outcome;
}

export function toOperation(record: StoredInspection): SyncOperation {
  const { syncStatus, baseVersion, remoteCopy, ...remote } = record;
  return {
    clientId: record.clientId,
    version: record.version,
    baseVersion: baseVersion ?? 0,
    record: remote,
  };
}

async function runSync(send: SendOperation, factory?: IDBFactory): Promise<SyncSummary> {
  const pending = await getPending(factory);
  const summary: SyncSummary = {
    attempted: pending.length,
    synced: 0,
    conflicts: 0,
    failed: 0,
    requeued: 0,
  };

  // Los envíos van en paralelo y cada respuesta se aplica por clientId y
  // versión, así que no importa en qué orden lleguen.
  await Promise.all(
    pending.map(async (record) => {
      let response: SyncResponse;
      try {
        response = await send(toOperation(record));
      } catch {
        // Sin red o sin respuesta: el registro sigue en la cola con el mismo
        // clientId y se reintenta después sin crear un duplicado.
        summary.failed++;
        return;
      }

      if (response.status === "ok") {
        if (await markSynced(record.clientId, response.version, factory)) summary.synced++;
        else summary.requeued++;
        return;
      }

      const outcome = await applyRemote(record.clientId, response.remote, factory);
      if (outcome === "conflict") summary.conflicts++;
      else if (outcome === "keep-local") summary.requeued++;
      else summary.synced++;
    })
  );

  return summary;
}

const running = new Map<IDBFactory | undefined, Promise<SyncSummary>>();

/**
 * Envía todo lo pendiente. Si ya hay una sincronización en curso devuelve esa
 * misma promesa, para no mandar dos veces la misma versión en paralelo.
 */
export function syncPending(send: SendOperation, factory?: IDBFactory): Promise<SyncSummary> {
  const current = running.get(factory);
  if (current) return current;

  const run = runSync(send, factory).finally(() => running.delete(factory));
  running.set(factory, run);
  return run;
}

/** Envía operaciones al endpoint del servidor con un tiempo máximo de espera. */
export function createFetchSender(
  url = "/api/inspecciones/sync",
  timeoutMs = 10000
): SendOperation {
  return async (operation) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": operation.clientId },
        body: JSON.stringify(operation),
        signal: controller.signal,
      });

      if (response.status === 409) {
        const body = (await response.json()) as { remote: RemoteInspection };
        return { status: "conflict", remote: body.remote };
      }
      if (!response.ok) {
        throw new Error(`El servidor respondió ${response.status}.`);
      }

      const body = (await response.json()) as { version: number };
      return { status: "ok", version: body.version };
    } finally {
      clearTimeout(timer);
    }
  };
}

export type AutoSyncOptions = {
  factory?: IDBFactory;
  baseDelayMs?: number;
  maxDelayMs?: number;
};

/**
 * Sincroniza al cargar y cada vez que el navegador recupera la red. Si quedan
 * registros sin confirmar, reintenta con espera exponencial.
 * Devuelve una función para detenerlo.
 */
export function startAutoSync(
  send: SendOperation = createFetchSender(),
  { factory, baseDelayMs = 5000, maxDelayMs = 300000 }: AutoSyncOptions = {}
): () => void {
  if (typeof window === "undefined") return () => {};

  let attempt = 0;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const run = async () => {
    if (stopped) return;
    clearTimeout(timer);
    if (navigator.onLine === false) return; // se espera el evento "online"

    try {
      const summary = await syncPending(send, factory);
      if (summary.attempted > 0) console.info("[sync] resultado", summary);

      const remaining = summary.failed + summary.requeued;
      attempt = remaining > 0 ? attempt + 1 : 0;
      if (remaining > 0 && !stopped) {
        timer = setTimeout(run, Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs));
      }
    } catch (error) {
      console.warn("[sync] no se pudo leer la cola local", error);
    }
  };

  window.addEventListener("online", run);
  void run();

  return () => {
    stopped = true;
    clearTimeout(timer);
    window.removeEventListener("online", run);
  };
}
