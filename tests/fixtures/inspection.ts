import type { Inspection } from "../../src/lib/data/inspections";
import { createStoredInspection } from "../../src/lib/storage/schema";

/** Una copia nueva por caso: no comparte objetos mutables con otros tests. */
export function inspectionFixture(overrides: Partial<Inspection> = {}): Inspection {
  return {
    id: "inspection-week08",
    location: "Laboratorio sintético 08",
    date: "2026-10-23",
    inspector: "Persona de prueba",
    status: "ok",
    statusLabel: "Sin incidencias",
    findings: 0,
    summary: "Inspección sintética para pruebas automatizadas.",
    ...overrides,
  };
}

export function storedInspectionFixture() {
  return createStoredInspection(inspectionFixture(), {
    clientId: "week08-client-fixed",
    version: 1,
    updatedAt: "2026-10-23T12:00:00.000Z",
  });
}
