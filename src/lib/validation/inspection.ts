import type { Inspection } from "@/lib/data/inspections";

/** Regla de captura compartida con la entrada real de sincronización. */
export function isValidInspection(input: unknown): input is Inspection {
  if (!input || typeof input !== "object") return false;
  const record = input as Partial<Inspection>;
  const texts = [record.id, record.location, record.date, record.inspector, record.statusLabel, record.summary];
  return texts.every((value) => typeof value === "string" && value.trim().length > 0)
    && (record.status === "ok" || record.status === "attention")
    && typeof record.findings === "number"
    && Number.isInteger(record.findings)
    && record.findings >= 0;
}
