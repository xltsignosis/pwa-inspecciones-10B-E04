"use client";
// Ruta CSR: el servidor solo envía el estado "loading"; los datos se piden con
// fetch en useEffect, ya en el navegador. Para evitar hydration mismatch el
// estado inicial siempre es "loading" y el render no usa window, Date.now()
// ni Math.random().
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LoadingState } from "@/components/loading-state";
import type { Inspection } from "@/lib/data/inspections";

type DetailState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "ready"; inspection: Inspection };

export default function InspeccionDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });

    async function load() {
      try {
        const response = await fetch(`/api/inspecciones/${encodeURIComponent(id)}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 404) {
          setState({ status: "not-found" });
          return;
        }

        if (!response.ok) {
          setState({ status: "error", message: `El servidor respondió con estado ${response.status}.` });
          return;
        }

        const inspection: Inspection = await response.json();
        setState({ status: "ready", inspection });
      } catch (error) {
        // El abort ocurre al desmontar o al cambiar de id; no es un fallo real.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setState({ status: "error", message: "No se pudo cargar la inspección. Revisa tu conexión." });
      }
    }

    load();

    return () => controller.abort();
  }, [id, attempt]);

  const backLink = <a href="/inspecciones">← Volver a inspecciones</a>;

  if (state.status === "loading") {
    return (
      <main className="page-shell">
        <LoadingState status="loading" />
      </main>
    );
  }

  if (state.status === "not-found") {
    return (
      <main className="page-shell">
        <LoadingState status="error" message="No existe la inspección solicitada." />
        <p>{backLink}</p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="page-shell">
        <LoadingState status="error" message={state.message} />
        <p>
          <button type="button" className="action-btn" onClick={() => setAttempt((n) => n + 1)}>
            Reintentar
          </button>
        </p>
        <p>{backLink}</p>
      </main>
    );
  }

  const { inspection } = state;

  return (
    <main className="page-shell">
      <p>{backLink}</p>
      <article className="inspection-card" aria-labelledby="inspection-title">
        <div className="card-topline">
          <span className={`badge badge-${inspection.status}`}>{inspection.statusLabel}</span>
          <time className="muted" dateTime={inspection.date}>
            {inspection.date}
          </time>
        </div>
        <h1 id="inspection-title">{inspection.location}</h1>
        <p>{inspection.summary}</p>
        <dl>
          <div>
            <dt>Responsable</dt>
            <dd>{inspection.inspector}</dd>
          </div>
          <div>
            <dt>Hallazgos</dt>
            <dd>{inspection.findings}</dd>
          </div>
        </dl>
      </article>
    </main>
  );
}
