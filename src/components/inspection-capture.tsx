"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { captureEvidence } from "@/lib/device/camera";
import type { Inspection, InspectionStatus } from "@/lib/data/inspections";
import { createStoredInspection, type StoredInspection } from "@/lib/storage/schema";
import { INSPECTIONS_CHANGED_EVENT } from "@/lib/storage/events";
import { createFetchSender, enqueue, getAllRecords, syncPending } from "@/lib/sync/queue";
import { isValidInspection } from "@/lib/validation/inspection";

const labels: Record<InspectionStatus, string> = {
  ok: "Sin incidencias", attention: "Requiere atención",
};
const syncLabels = { pending: "Pendiente", synced: "Sincronizada", conflict: "Conflicto" };

export function InspectionCapture() {
  const [records, setRecords] = useState<StoredInspection[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [photoNote, setPhotoNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const operation = useRef<StoredInspection | null>(null);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    let revision = 0;
    const refresh = async () => {
      const requested = ++revision;
      try {
        const saved = await getAllRecords();
        if (active && requested === revision) { setRecords(saved); setReady(true); }
      } catch {
        if (active) setError("No se pudo leer el almacenamiento local. Intenta recargar.");
      }
    };
    window.addEventListener(INSPECTIONS_CHANGED_EVENT, refresh);
    void refresh();
    return () => { active = false; window.removeEventListener(INSPECTIONS_CHANGED_EVENT, refresh); };
  }, []);

  useEffect(() => {
    if (photo) return () => URL.revokeObjectURL(photo);
  }, [photo]);

  async function attachPhoto() {
    setCameraBusy(true);
    const result = await captureEvidence();
    setCameraBusy(false);
    if (result.status === "captured") {
      setPhoto(URL.createObjectURL(result.blob));
      setPhotoNote("Foto disponible solo en esta pestaña; no se guarda ni sincroniza.");
    } else {
      setPhotoNote(result.status === "denied"
        ? "Permiso de cámara denegado. Puedes guardar la inspección sin foto."
        : "Cámara no disponible. Puedes guardar la inspección sin foto.");
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const status = String(fields.get("status")) as InspectionStatus;
    const inspection: Inspection = {
      id: operation.current?.id ?? crypto.randomUUID(),
      location: String(fields.get("location")).trim(),
      date: String(fields.get("date")),
      inspector: String(fields.get("inspector")).trim(),
      status, statusLabel: labels[status],
      findings: Number(fields.get("findings")),
      summary: String(fields.get("summary")).trim(),
    };
    if (!isValidInspection(inspection)) {
      setError("Completa los campos y usa un número entero de hallazgos mayor o igual a cero.");
      return;
    }
    submitting.current = true;
    setSaving(true); setError(""); setNotice("");
    try {
      // Un fallo de almacenamiento conserva la identidad para el siguiente intento.
      operation.current = createStoredInspection(inspection, operation.current ?? {});
      await enqueue(operation.current);
      operation.current = null;
      form.reset(); setPhoto(null); setPhotoNote("");
      setNotice("Inspección guardada en este dispositivo.");
      if (navigator.onLine) {
        try { await syncPending(createFetchSender()); }
        catch { setNotice("Guardada localmente. La sincronización se reintentará al reconectar."); }
      }
    } catch {
      setError("No se pudo guardar en este dispositivo. Conservamos los campos para reintentar.");
    } finally {
      submitting.current = false; setSaving(false);
    }
  }

  return (
    <section className="capture-panel" aria-labelledby="capture-title">
      <h2 id="capture-title">Registrar inspección</h2>
      <p>Usa únicamente laboratorios, roles y observaciones sintéticos. Puedes guardar sin conexión y sin foto.</p>
      <form aria-label="Captura de inspección" onSubmit={save}>
        <div className="capture-fields">
          <label>Laboratorio<input name="location" required autoComplete="off" /></label>
          <label>Fecha<input name="date" type="date" required /></label>
          <label>Rol del inspector<input name="inspector" required placeholder="Ej. Técnico de prueba" autoComplete="off" /></label>
          <label>Estado<select name="status" defaultValue="ok">
            <option value="ok">Sin incidencias</option><option value="attention">Requiere atención</option>
          </select></label>
          <label>Hallazgos<input name="findings" type="number" min="0" step="1" defaultValue="0" required /></label>
          <label>Resumen<textarea name="summary" required /></label>
        </div>
        <button type="button" className="action-btn action-btn-secondary" disabled={cameraBusy} onClick={attachPhoto}>
          {cameraBusy ? "Abriendo cámara…" : "Adjuntar foto"}
        </button>
        <p role="status" aria-live="polite">{photoNote}</p>
        {/* La vista previa usa un blob temporal del navegador, sin optimización remota. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {photo && <img className="evidence-preview" src={photo} alt="Foto temporal de la captura" />}
        <button type="submit" className="action-btn" disabled={saving || !ready}>
          {saving ? "Guardando…" : "Guardar inspección"}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      <p role="status" aria-live="polite">{notice}</p>
      <section aria-labelledby="local-inspections-title">
        <h3 id="local-inspections-title">Inspecciones de este dispositivo</h3>
        {!ready ? <p role="status">Leyendo almacenamiento local…</p> : records.length === 0
          ? <p>No hay registros locales guardados.</p>
          : <ul className="local-inspections">{records.map(record => (
            <li key={record.clientId} data-client-id={record.clientId}>
              <strong>{record.location}</strong>
              <p>{record.date} · {record.inspector} · {record.statusLabel} · {record.findings} hallazgos</p>
              <p>{record.summary}</p>
              <span role="status">{syncLabels[record.syncStatus]}</span>
            </li>
          ))}</ul>}
      </section>
    </section>
  );
}
