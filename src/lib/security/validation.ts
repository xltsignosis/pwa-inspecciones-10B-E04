import type { Inspection } from "@/lib/data/inspections";
import type { RemoteInspection } from "@/lib/storage/schema";
import type { SyncOperation, SyncResponse } from "@/lib/sync/queue";

const inspectionFields = ["id", "location", "date", "inspector", "status", "statusLabel", "findings", "summary"];
const remoteFields = [...inspectionFields, "clientId", "version", "updatedAt"];

/** Solo objetos de datos, sin propiedades heredadas, accesores ni campos extra. */
function hasExactFields(input: unknown, fields: string[]): input is Record<string, unknown> {
  if (!input || typeof input !== "object") return false;
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const keys = Reflect.ownKeys(input);
  return keys.length === fields.length && fields.every((field) => {
    const descriptor = Object.getOwnPropertyDescriptor(input, field);
    return descriptor !== undefined && "value" in descriptor && descriptor.enumerable;
  });
}

function isText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max
    // Se permiten saltos de línea y tabulaciones en las observaciones.
    && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
}

export function isIdentifier(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value);
}

export function isSafeCount(value: unknown, min: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= min;
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  return isDate(value.slice(0, 10)) && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value;
}

function hasInspectionValues(record: Record<string, unknown>): boolean {
  return isIdentifier(record.id) && isText(record.location, 200)
    && isDate(record.date) && isText(record.inspector, 120)
    && (record.status === "ok" || record.status === "attention")
    && isText(record.statusLabel, 80) && isText(record.summary, 2000)
    && isSafeCount(record.findings, 0) && record.findings <= 10_000;
}

export function isValidInspection(input: unknown): input is Inspection {
  return hasExactFields(input, inspectionFields) && hasInspectionValues(input);
}

export function isValidRemoteInspection(input: unknown): input is RemoteInspection {
  return hasExactFields(input, remoteFields) && hasInspectionValues(input)
    && isIdentifier(input.clientId) && isSafeCount(input.version, 1) && isTimestamp(input.updatedAt);
}

/** La validación del servidor no depende de que el cliente haya validado antes. */
export function validateSyncOperation(input: unknown): SyncOperation | null {
  if (!hasExactFields(input, ["clientId", "version", "baseVersion", "record"])) return null;
  if (!isIdentifier(input.clientId) || !isSafeCount(input.version, 1)
    || !isSafeCount(input.baseVersion, 0) || input.baseVersion >= input.version
    || !isValidRemoteInspection(input.record)) return null;
  if (input.record.clientId !== input.clientId || input.record.version !== input.version) return null;
  return input as SyncOperation;
}

/** No confirmar ni sobrescribir datos locales con una respuesta inesperada. */
export function validateSyncResponse(input: unknown, operation: SyncOperation, conflict: boolean): SyncResponse | null {
  if (conflict) {
    if (!hasExactFields(input, ["status", "remote"]) || input.status !== "conflict"
      || !isValidRemoteInspection(input.remote) || input.remote.clientId !== operation.clientId) return null;
    return { status: "conflict", remote: input.remote };
  }
  if (!hasExactFields(input, ["status", "version", "duplicate"]) || input.status !== "ok"
    || input.version !== operation.version || typeof input.duplicate !== "boolean") return null;
  return { status: "ok", version: operation.version };
}
