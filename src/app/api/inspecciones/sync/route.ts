// Endpoint de sincronización: recibe las operaciones de la cola local.
// Guarda en memoria (datos sintéticos) y usa clientId como clave de idempotencia.
import { createSyncServer } from "@/lib/sync/server-store";

export const dynamic = "force-dynamic";

const server = createSyncServer();

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "El cuerpo no es JSON válido." }, { status: 400 });
  }

  const result = server.receive(payload);
  return Response.json(result.body, { status: result.status });
}
