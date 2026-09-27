// Endpoint de solo lectura que consume la ruta CSR /inspecciones/[id].
// Devuelve datos sintéticos; responde 404 si el id no existe.
import { inspections } from "@/lib/data/inspections";

export const dynamic = "force-dynamic";

export function GET(_request: Request, { params }: { params: { id: string } }) {
  const inspection = inspections.find((item) => item.id === params.id);

  if (!inspection) {
    return Response.json({ error: "Inspección no encontrada." }, { status: 404 });
  }

  return Response.json(inspection);
}
