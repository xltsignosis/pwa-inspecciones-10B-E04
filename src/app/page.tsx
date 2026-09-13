"use client";

import { useState } from "react";
import { AppShell } from "../components/app-shell";
import { inspections } from "../lib/data/inspections";

type ViewState = "ready" | "loading" | "empty" | "error";

export default function HomePage() {
  const [viewState, setViewState] = useState<ViewState>("ready");

  return (
    <AppShell activeRoute="inicio" statusBadge="PWA Instalable · Semana 2">
      <div className="page-shell">
        {/* Encabezado principal */}
        <header className="hero">
          <p className="eyebrow">Proyecto base · Semana 2</p>
          <h1>Inspecciones de laboratorio</h1>
          <p className="lead">
            Registro de mantenimiento para trabajar con conectividad intermitente.
            Los datos mostrados son sintéticos y modelan la operación de laboratorios universitarios.
          </p>
          <span className="status">Estado del starter: App shell integrado · Manifest PWA enlazado</span>
        </header>

        {/* Sección de contenido con estados */}
        <section aria-labelledby="inspections-heading" className="content-section">
          {/* Barra de control para verificar y evaluar los estados de la UI */}
          <div className="state-toolbar" role="region" aria-label="Control de estados de la interfaz">
            <span className="state-toolbar-label">
              <span aria-hidden="true">⚙️</span>
              Simulador de estados de interfaz:
            </span>
            <div className="state-btn-group" role="group" aria-label="Seleccionar estado de vista">
              <button
                type="button"
                className={`state-btn ${viewState === "ready" ? "active" : ""}`}
                onClick={() => setViewState("ready")}
                aria-pressed={viewState === "ready"}
              >
                Normal (3 datos)
              </button>
              <button
                type="button"
                className={`state-btn ${viewState === "loading" ? "active" : ""}`}
                onClick={() => setViewState("loading")}
                aria-pressed={viewState === "loading"}
              >
                Cargando (Skeleton)
              </button>
              <button
                type="button"
                className={`state-btn ${viewState === "empty" ? "active" : ""}`}
                onClick={() => setViewState("empty")}
                aria-pressed={viewState === "empty"}
              >
                Vacío (Empty state)
              </button>
              <button
                type="button"
                className={`state-btn ${viewState === "error" ? "active" : ""}`}
                onClick={() => setViewState("error")}
                aria-pressed={viewState === "error"}
              >
                Error de conexión
              </button>
            </div>
          </div>

          <div className="section-heading">
            <div>
              <p className="eyebrow">Datos de demostración</p>
              <h2 id="inspections-heading">Inspecciones recientes</h2>
            </div>
            <span className="count" aria-live="polite">
              {viewState === "ready"
                ? `${inspections.length} registros`
                : viewState === "loading"
                ? "Cargando..."
                : viewState === "empty"
                ? "0 registros"
                : "Error"}
            </span>
          </div>

          {/* 1. Estado de Carga (Loading con skeletons accesibles) */}
          {viewState === "loading" && (
            <div
              className="inspection-grid"
              role="status"
              aria-busy="true"
              aria-label="Cargando registros de inspección..."
            >
              <span className="sr-only">Cargando inspecciones recientes, por favor espere...</span>
              {[1, 2, 3].map((index) => (
                <div className="skeleton-card" key={`skeleton-${index}`} aria-hidden="true">
                  <div className="card-topline">
                    <div className="skeleton-shimmer skeleton-pill"></div>
                    <div className="skeleton-shimmer skeleton-date"></div>
                  </div>
                  <div className="skeleton-shimmer skeleton-title"></div>
                  <div className="skeleton-shimmer skeleton-body-1"></div>
                  <div className="skeleton-shimmer skeleton-body-2"></div>
                  <dl>
                    <div className="skeleton-shimmer skeleton-row"></div>
                    <div className="skeleton-shimmer skeleton-row"></div>
                  </dl>
                </div>
              ))}
            </div>
          )}

          {/* 2. Estado Vacío (Empty State) */}
          {viewState === "empty" && (
            <div className="empty-state" role="region" aria-label="Sin registros de inspecciones">
              <div className="empty-icon" aria-hidden="true">
                📋
              </div>
              <h3 className="empty-title">No hay inspecciones registradas</h3>
              <p className="empty-desc">
                No se encontraron inspecciones en el almacenamiento local ni en la cola sintética.
                Puedes generar datos sintéticos o registrar una nueva inspección para comenzar.
              </p>
              <button
                type="button"
                className="action-btn"
                onClick={() => setViewState("ready")}
              >
                <span aria-hidden="true">🔄</span> Cargar datos sintéticos
              </button>
            </div>
          )}

          {/* 3. Estado de Error */}
          {viewState === "error" && (
            <div className="error-state" role="alert" aria-live="assertive">
              <div className="error-icon" aria-hidden="true">
                ⚠️
              </div>
              <h3 className="error-title">Fallo de comunicación de red</h3>
              <p className="error-desc">
                No fue posible sincronizar las inspecciones con el servidor central de laboratorios.
                La PWA continuará operando en modo desconectado.
              </p>
              <button
                type="button"
                className="action-btn"
                onClick={() => {
                  setViewState("loading");
                  setTimeout(() => setViewState("ready"), 600);
                }}
              >
                <span aria-hidden="true">↻</span> Reintentar consulta
              </button>
            </div>
          )}

          {/* 4. Estado Normal (Ready con datos sintéticos) */}
          {viewState === "ready" && (
            <div className="inspection-grid" role="list">
              {inspections.map((inspection) => (
                <article
                  className="inspection-card"
                  key={inspection.id}
                  role="listitem"
                  aria-labelledby={`title-${inspection.id}`}
                >
                  <div className="card-topline">
                    <span className={`badge badge-${inspection.status}`}>
                      {inspection.statusLabel}
                    </span>
                    <time className="muted" dateTime={inspection.date}>
                      {inspection.date}
                    </time>
                  </div>
                  <h3 id={`title-${inspection.id}`}>{inspection.location}</h3>
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
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
