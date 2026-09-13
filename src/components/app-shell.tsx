import React from "react";

export interface AppShellProps {
  children: React.ReactNode;
  activeRoute?: "inicio" | "inspecciones" | "reportes";
  statusBadge?: string;
}

/**
 * AppShell: Shell principal accesible para la PWA de inspecciones de laboratorio.
 * Proporciona landmarks HTML5 (header, nav, main, footer), enlace de salto para
 * accesibilidad por teclado y contenedor responsive.
 */
export function AppShell({
  children,
  activeRoute = "inicio",
  statusBadge = "PWA Instalable · Semana 2",
}: AppShellProps) {
  return (
    <div className="app-shell-root">
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      {/* Header y Branding */}
      <header className="app-header" role="banner">
        <div className="header-inner">
          <div className="brand-group">
            <div className="brand-icon" aria-hidden="true">
              🔬
            </div>
            <div>
              <span className="brand-title">Inspecciones de laboratorio</span>
              <span className="brand-sub">UTT · Ingeniería en Software</span>
            </div>
          </div>

          <div className="header-actions">
            <span className="pwa-badge" role="status">
              <span className="pwa-dot" aria-hidden="true"></span>
              {statusBadge}
            </span>
          </div>
        </div>

        {/* Navegación principal */}
        <nav aria-label="Navegación principal" className="main-nav">
          <ul className="nav-list" role="menubar">
            <li role="none">
              <a
                href="#inicio"
                role="menuitem"
                className={`nav-link ${activeRoute === "inicio" ? "active" : ""}`}
                aria-current={activeRoute === "inicio" ? "page" : undefined}
              >
                Inicio
              </a>
            </li>
            <li role="none">
              <a
                href="#inspecciones"
                role="menuitem"
                className={`nav-link ${activeRoute === "inspecciones" ? "active" : ""}`}
                aria-current={activeRoute === "inspecciones" ? "page" : undefined}
              >
                Inspecciones
              </a>
            </li>
            <li role="none">
              <a
                href="#reportes"
                role="menuitem"
                className={`nav-link ${activeRoute === "reportes" ? "active" : ""}`}
                aria-current={activeRoute === "reportes" ? "page" : undefined}
              >
                Reportes
              </a>
            </li>
          </ul>
        </nav>
      </header>

      {/*Contenedor principal de contenido */}
      <main id="main-content" tabIndex={-1} className="main-content" role="main">
        {children}
      </main>

      {/* Pie de página */}
      <footer className="app-footer" role="contentinfo">
        <div className="footer-inner">
          <p>
            <strong>Aplicaciones Web Progresivas</strong> · Universidad Tecnológica de Tehuacán
          </p>
          <p className="footer-muted">
            Datos exclusivamente sintéticos · Shell accesible con landmarks verificables
          </p>
        </div>
      </footer>
    </div>
  );
}

export default AppShell;

