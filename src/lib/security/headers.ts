/** Nonce generado en el servidor por petición, nunca tomado del cliente. */
export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...Array.from(bytes)));
}

export function contentSecurityPolicy(nonce: string, development = false): string {
  if (!/^[A-Za-z0-9+/]{22}==$/.test(nonce)) throw new Error("Nonce inválido.");
  return [
    "default-src 'none'",
    `script-src 'self' 'nonce-${nonce}'${development ? " 'unsafe-eval'" : ""}`,
    "script-src-attr 'none'",
    `style-src 'self' 'nonce-${nonce}'`,
    // React/Next usa atributos de estilo para los límites de carga en streaming.
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' blob:",
    "font-src 'self'",
    `connect-src 'self'${development ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "media-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
}
