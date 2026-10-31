/**
 * La aplicación no necesita configuración pública. Next incrusta NEXT_PUBLIC_*
 * en el cliente: se rechazan hasta que exista una lista explícita y revisada.
 * Nunca incluir valores del entorno en errores o registros.
 */
export function assertNoPublicEnvironment(environment) {
  if (Object.keys(environment).some(name => name.startsWith("NEXT_PUBLIC_"))) {
    throw new Error("No se permite configuración NEXT_PUBLIC_: este proyecto no requiere variables públicas. Mantén los secretos solo en el servidor.");
  }
}
