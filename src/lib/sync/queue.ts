import {
  INSPECTIONS_STORE_NAME,
  INSPECTIONS_INDEXES,
  openInspectionDatabase,
  type StoredInspection,
} from "@/lib/storage/schema";

/**
 * Guarda (o actualiza) una inspección en el almacén local.
 * Como `clientId` es la keyPath del object store, volver a llamar con la
 * misma inspección (mismo clientId) sobrescribe el registro existente en
 * vez de duplicarlo: esto es lo que garantiza la idempotencia al reintentar.
 */
export async function enqueue(inspection: StoredInspection): Promise<void> {
  const db = await openInspectionDatabase();
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
export async function getPending(): Promise<StoredInspection[]> {
  const db = await openInspectionDatabase();
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

/**
 * Marca una inspección como sincronizada. Esto SOLO debe llamarse tras una
 * confirmación real del servidor: un timeout no prueba que la operación no
 * se haya ejecutado, así que nunca se usa este método ante un simple fallo
 * de red o expiración de tiempo.
 */
export async function markSynced(clientId: string): Promise<void> {
  const db = await openInspectionDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(INSPECTIONS_STORE_NAME, "readwrite");
    const store = tx.objectStore(INSPECTIONS_STORE_NAME);
    const getRequest = store.get(clientId);
    getRequest.onsuccess = () => {
      const record = getRequest.result as StoredInspection | undefined;
      if (!record) {
        resolve();
        return;
      }
      store.put({ ...record, syncStatus: "synced" as const });
    };
    getRequest.onerror = () => reject(getRequest.error ?? new Error("No se encontró el registro."));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("No se pudo marcar como sincronizada."));
  });
  db.close();
}

/**
 * Marca un registro con conflicto, para que conflict-policy.ts decida
 * cómo resolverlo.
 */
export async function markConflict(clientId: string): Promise<void> {
  const db = await openInspectionDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(INSPECTIONS_STORE_NAME, "readwrite");
    const store = tx.objectStore(INSPECTIONS_STORE_NAME);
    const getRequest = store.get(clientId);
    getRequest.onsuccess = () => {
      const record = getRequest.result as StoredInspection | undefined;
      if (!record) {
        resolve();
        return;
      }
      store.put({ ...record, syncStatus: "conflict" as const });
    };
    getRequest.onerror = () => reject(getRequest.error ?? new Error("No se encontró el registro."));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("No se pudo marcar el conflicto."));
  });
  db.close();
}