// Endpoint de sincronización: recibe las operaciones de la cola local.
// Guarda en memoria (datos sintéticos) y usa clientId como clave de idempotencia.
import { createSyncServer } from "@/lib/sync/server-store";
import { InputError, readSyncJson } from "@/lib/security/request";

export const dynamic = "force-dynamic";

const server = createSyncServer();

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await readSyncJson(request);
  } catch (error) {
    if (!(error instanceof InputError)) throw error;
    return Response.json({ error: error.message }, { status: error.status });
  }

  const result = server.receive(payload);
  return Response.json(result.body, { status: result.status });
}
