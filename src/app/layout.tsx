import type { Metadata } from "next";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";
import { SyncRegistrar } from "@/components/sync-registrar";

// Cada documento necesita scripts con el nonce de su propia respuesta CSP.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inspecciones de laboratorio",
  description: "Proyecto base de Aplicaciones Web Progresivas",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body>
        {children}
        <ServiceWorkerRegistrar />
        <SyncRegistrar />
      </body>
    </html>
  );
}
