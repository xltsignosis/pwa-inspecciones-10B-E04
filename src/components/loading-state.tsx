import * as React from "react";

type LoadingStateProps = {
  status: "loading" | "empty" | "error";
  message?: string;
};

const DEFAULT_MESSAGES = {
  loading: "Cargando inspecciones, por favor espera...",
  empty: "No hay inspecciones registradas.",
  error: "No se pudieron cargar las inspecciones.",
} as const;

/**
 * Estado compartido por las rutas CSR y SSR.
 *
 * No necesita `use client`: recibe datos simples y produce el mismo HTML en el
 * servidor y en el primer render del navegador. Las acciones de recuperación
 * permanecen en la ruta que conoce cómo volver a solicitar sus datos.
 */
export function LoadingState({ status, message }: LoadingStateProps) {
  const accessibleMessage = message ?? DEFAULT_MESSAGES[status];

  if (status === "loading") {
    return (
      <section
        className="inspection-grid"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={accessibleMessage}
      >
        <span className="sr-only">{accessibleMessage}</span>
        {[1, 2, 3].map((index) => (
          <div className="skeleton-card" key={index} aria-hidden="true">
            <div className="card-topline">
              <div className="skeleton-shimmer skeleton-pill" />
              <div className="skeleton-shimmer skeleton-date" />
            </div>
            <div className="skeleton-shimmer skeleton-title" />
            <div className="skeleton-shimmer skeleton-body-1" />
            <div className="skeleton-shimmer skeleton-body-2" />
            <div className="skeleton-shimmer skeleton-row" />
          </div>
        ))}
      </section>
    );
  }

  if (status === "empty") {
    return (
      <section className="empty-state" role="status" aria-live="polite">
        <div className="empty-icon" aria-hidden="true">
          📋
        </div>
        <h2 className="empty-title">Sin inspecciones</h2>
        <p className="empty-desc">{accessibleMessage}</p>
      </section>
    );
  }

  return (
    <section className="error-state" role="alert" aria-live="assertive">
      <div className="error-icon" aria-hidden="true">
        ⚠️
      </div>
      <h2 className="error-title">No fue posible cargar la información</h2>
      <p className="error-desc">{accessibleMessage}</p>
    </section>
  );
}
