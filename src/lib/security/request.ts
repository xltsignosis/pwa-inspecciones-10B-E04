export const MAX_SYNC_BODY_BYTES = 32 * 1024;

export class InputError extends Error {
  constructor(public readonly status: 400 | 413 | 415, message: string) {
    super(message);
  }
}

/** Limita bytes reales aunque Content-Length falte o sea incorrecto. */
export async function readSyncJson(request: Request): Promise<unknown> {
  const mediaType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (mediaType !== "application/json") throw new InputError(415, "Se requiere application/json.");
  const declaredSize = Number(request.headers.get("content-length"));
  if (declaredSize > MAX_SYNC_BODY_BYTES) throw new InputError(413, "El cuerpo excede el límite permitido.");
  const reader = request.body?.getReader();
  if (!reader) throw new InputError(400, "El cuerpo no es JSON válido.");
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_SYNC_BODY_BYTES) {
        await reader.cancel();
        throw new InputError(413, "El cuerpo excede el límite permitido.");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch (error) {
    if (error instanceof InputError) throw error;
    throw new InputError(400, "El cuerpo no es JSON válido.");
  } finally {
    reader.releaseLock();
  }
}
