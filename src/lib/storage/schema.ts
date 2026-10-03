import type { Inspection } from "@/lib/data/inspections";

/** Estados posibles de una inspeccion almacenada en el dispositivo. */
export type SyncStatus = "pending" | "synced" | "conflict";

/**
 * Inspection enriquecida con la informacion necesaria para sincronizarla.
 *
 * `clientId` se genera una sola vez en el cliente y debe reutilizarse en cada
 * reintento. De esta manera el servidor puede reconocer una operacion repetida
 * y evitar insertar la misma inspeccion dos veces.
 */
export type StoredInspection = Inspection & {
  clientId: string;
  syncStatus: SyncStatus;
  version: number;
  updatedAt: string;
  /** Ultima version confirmada por el servidor; permite detectar cambios concurrentes. */
  baseVersion?: number;
  /** Copia remota conservada cuando hay conflicto, para que el usuario decida. */
  remoteCopy?: RemoteInspection;
};

/** Forma de una inspeccion tal como la guarda el servidor. */
export type RemoteInspection = Inspection & {
  clientId: string;
  version: number;
  updatedAt: string;
};

export const INSPECTIONS_DB_NAME = "laboratory-inspections";
export const INSPECTIONS_DB_VERSION = 1;
export const INSPECTIONS_STORE_NAME = "inspections";

export const INSPECTIONS_INDEXES = {
  inspectionId: "by-inspection-id",
  syncStatus: "by-sync-status",
  updatedAt: "by-updated-at"
} as const;

export type StoredInspectionMetadata = Partial<
  Pick<StoredInspection, "clientId" | "syncStatus" | "version" | "updatedAt">
>;

/** Genera la clave idempotente que acompana a todos los reintentos. */
export function createClientId(): string {
  const browserCrypto = globalThis.crypto;

  if (!browserCrypto || typeof browserCrypto.randomUUID !== "function") {
    throw new Error(
      "No es posible generar un identificador seguro en este entorno."
    );
  }

  return browserCrypto.randomUUID();
}

/**
 * Prepara una inspeccion para guardarla localmente por primera vez.
 * Los metadatos opcionales facilitan restaurar registros y escribir pruebas
 * deterministas sin cambiar el comportamiento usado en produccion.
 */
export function createStoredInspection(
  inspection: Inspection,
  metadata: StoredInspectionMetadata = {}
): StoredInspection {
  return {
    ...inspection,
    clientId: metadata.clientId ?? createClientId(),
    syncStatus: metadata.syncStatus ?? "pending",
    version: metadata.version ?? 1,
    updatedAt: metadata.updatedAt ?? new Date().toISOString()
  };
}

/**
 * Abre la base local y crea su esquema cuando se usa por primera vez.
 * Se acepta una fabrica opcional para poder probar el modulo sin depender de
 * una base real del navegador.
 */
export function openInspectionDatabase(
  factory?: IDBFactory
): Promise<IDBDatabase> {
  const indexedDbFactory = factory ?? globalThis.indexedDB;

  if (!indexedDbFactory) {
    return Promise.reject(
      new Error("IndexedDB no esta disponible en este entorno.")
    );
  }

  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;

    try {
      request = indexedDbFactory.open(
        INSPECTIONS_DB_NAME,
        INSPECTIONS_DB_VERSION
      );
    } catch (error) {
      reject(error);
      return;
    }

    request.onupgradeneeded = () => {
      const database = request.result;
      const transaction = request.transaction;
      let store: IDBObjectStore;

      if (!database.objectStoreNames.contains(INSPECTIONS_STORE_NAME)) {
        store = database.createObjectStore(INSPECTIONS_STORE_NAME, {
          keyPath: "clientId"
        });
      } else if (transaction) {
        store = transaction.objectStore(INSPECTIONS_STORE_NAME);
      } else {
        throw new Error("No se pudo actualizar el esquema de IndexedDB.");
      }

      if (!store.indexNames.contains(INSPECTIONS_INDEXES.inspectionId)) {
        store.createIndex(INSPECTIONS_INDEXES.inspectionId, "id", {
          unique: false
        });
      }

      if (!store.indexNames.contains(INSPECTIONS_INDEXES.syncStatus)) {
        store.createIndex(INSPECTIONS_INDEXES.syncStatus, "syncStatus", {
          unique: false
        });
      }

      if (!store.indexNames.contains(INSPECTIONS_INDEXES.updatedAt)) {
        store.createIndex(INSPECTIONS_INDEXES.updatedAt, "updatedAt", {
          unique: false
        });
      }
    };

    request.onsuccess = () => {
      const database = request.result;

      // Permite que una version futura del esquema se instale sin quedar
      // bloqueada por una pestana que conserva esta conexion abierta.
      database.onversionchange = () => database.close();
      resolve(database);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("No se pudo abrir IndexedDB."));
    };

    request.onblocked = () => {
      reject(
        new Error(
          "La actualizacion de IndexedDB esta bloqueada por otra pestana."
        )
      );
    };
  });
}
