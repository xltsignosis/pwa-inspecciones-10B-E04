/** Aviso local después de confirmar una escritura; no transporta datos. */
export const INSPECTIONS_CHANGED_EVENT = "inspections:changed";

export function notifyInspectionsChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(INSPECTIONS_CHANGED_EVENT));
  }
}
