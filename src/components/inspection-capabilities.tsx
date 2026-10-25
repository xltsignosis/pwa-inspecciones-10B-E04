"use client";
// Ningún permiso se pide al montar: cámara, ubicación y notificaciones solo se
// invocan desde el onClick de su botón. Todo es opcional y cada fallo deja una
// alternativa (elegir imagen, escribir la ubicación, aviso dentro de la app).
import { useEffect, useState, type ChangeEvent } from "react";
import { captureEvidence } from "@/lib/device/camera";
import { getCurrentLocation } from "@/lib/device/geolocation";
import { describeStatusChange, notifyStatusChange } from "@/lib/notifications/client";
import type { Inspection, InspectionStatus } from "@/lib/data/inspections";

const STATUS_LABELS: Record<InspectionStatus, string> = {
  ok: "Sin incidencias",
  attention: "Requiere atención",
};

type InspectionCapabilitiesProps = {
  inspection: Inspection;
  onStatusChange: (status: InspectionStatus, statusLabel: string) => void;
};

export function InspectionCapabilities({ inspection, onStatusChange }: InspectionCapabilitiesProps) {
  const [notice, setNotice] = useState("");
  const [noticeDetail, setNoticeDetail] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoNote, setPhotoNote] = useState("");
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [locationText, setLocationText] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [busy, setBusy] = useState<"photo" | "location" | null>(null);

  // La foto vive solo en memoria de esta pestaña; se libera al cambiarla o salir.
  useEffect(() => {
    if (!photoUrl) return;
    return () => URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  const nextStatus: InspectionStatus = inspection.status === "ok" ? "attention" : "ok";

  async function handleStatusChange() {
    const change = {
      inspectionId: inspection.id,
      location: inspection.location,
      statusLabel: STATUS_LABELS[nextStatus],
    };
    onStatusChange(nextStatus, change.statusLabel);
    // El aviso en la app se muestra de inmediato, sin esperar la respuesta al permiso.
    setNotice(describeStatusChange(change));
    setNoticeDetail("");

    const result = await notifyStatusChange(change);
    if (result.status === "shown") {
      setNoticeDetail("También se envió una notificación del sistema.");
    } else if (result.status === "denied") {
      setNoticeDetail("Las notificaciones del sistema no están permitidas; el aviso se muestra solo aquí.");
    } else {
      setNoticeDetail("Este navegador no puede mostrar notificaciones del sistema; el aviso se muestra solo aquí.");
    }
  }

  async function handleAttachPhoto() {
    setBusy("photo");
    const result = await captureEvidence();
    setBusy(null);

    if (result.status === "captured") {
      setPhotoUrl(URL.createObjectURL(result.blob));
      setPhotoNote("Foto adjunta. Se conserva solo en esta pestaña.");
      return;
    }
    setShowFilePicker(true);
    setPhotoNote(
      result.status === "denied"
        ? "Permiso de cámara denegado. Puedes elegir una imagen o continuar sin foto."
        : "No se pudo usar la cámara en este dispositivo. Puedes elegir una imagen o continuar sin foto.",
    );
  }

  function handleFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoUrl(URL.createObjectURL(file));
    setPhotoNote("Imagen adjunta. Se conserva solo en esta pestaña.");
  }

  function handleRemovePhoto() {
    setPhotoUrl(null);
    setPhotoNote("Foto eliminada. La inspección continúa sin evidencia fotográfica.");
  }

  async function handleUseLocation() {
    setBusy("location");
    const result = await getCurrentLocation();
    setBusy(null);

    if (result.status === "granted") {
      const { latitude, longitude, accuracy } = result.coords;
      // Cuatro decimales (unos 11 m) bastan para ubicar un edificio.
      setLocationText(`${latitude.toFixed(4)}, ${longitude.toFixed(4)} (±${Math.round(accuracy)} m)`);
      setLocationNote("Ubicación tomada del dispositivo. Puedes corregirla a mano.");
      return;
    }
    // Se conserva lo que la persona ya había escrito.
    setLocationNote(result.message);
  }

  return (
    <section className="capability-panel" aria-labelledby="capabilities-title">
      <h2 id="capabilities-title">Evidencia y seguimiento</h2>
      <p className="muted">
        Todo es opcional. Los permisos se piden solo al presionar cada botón y la inspección se puede
        consultar sin cámara, ubicación ni notificaciones.
      </p>

      <div className="capability-block">
        <h3>Estado</h3>
        <button type="button" className="action-btn" onClick={handleStatusChange}>
          Marcar como «{STATUS_LABELS[nextStatus]}»
        </button>
        <p className="capability-note" role="status" aria-live="polite">
          {notice && <strong>{notice}</strong>} {noticeDetail}
        </p>
      </div>

      <div className="capability-block">
        <h3>Foto de evidencia</h3>
        <div className="capability-actions">
          <button type="button" className="action-btn" onClick={handleAttachPhoto} disabled={busy === "photo"}>
            {busy === "photo" ? "Abriendo cámara…" : "Adjuntar foto"}
          </button>
          {photoUrl && (
            <button type="button" className="action-btn action-btn-secondary" onClick={handleRemovePhoto}>
              Quitar foto
            </button>
          )}
        </div>
        {showFilePicker && (
          <label className="capability-field">
            Elegir una imagen
            <input type="file" accept="image/*" capture="environment" onChange={handleFileChosen} />
          </label>
        )}
        <p className="capability-note" role="status" aria-live="polite">
          {photoNote}
        </p>
        {photoUrl && (
          // El origen es un blob temporal local; no se envía al optimizador de imágenes.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="evidence-preview" src={photoUrl} alt="Foto adjunta como evidencia de la inspección" />
        )}
      </div>

      <div className="capability-block">
        <h3>Ubicación</h3>
        <label className="capability-field">
          Edificio, zona o referencia
          <input
            type="text"
            value={locationText}
            onChange={(event) => setLocationText(event.target.value)}
            placeholder="Ej. Edificio B, planta alta"
            autoComplete="off"
          />
        </label>
        <button type="button" className="action-btn" onClick={handleUseLocation} disabled={busy === "location"}>
          {busy === "location" ? "Obteniendo ubicación…" : "Usar mi ubicación"}
        </button>
        <p className="capability-note" role="status" aria-live="polite">
          {locationNote}
        </p>
      </div>
    </section>
  );
}
