# Controles de seguridad — Semana 09, integrante 2

## Validación

`validation.ts` exige objetos con campos exactos y rechaza arreglos, campos
adicionales, propiedades heredadas, símbolos, accesores y estructuras anidadas
donde se espera texto. No convierte tipos ni elimina campos silenciosamente.
El formulario y la entrada real del servidor comparten estas reglas.

| Campo | Regla |
| --- | --- |
| `id`, `clientId` | 1–128 caracteres alfanuméricos ASCII, guion y guion bajo; inicio alfanumérico |
| `location`, `inspector`, `statusLabel`, `summary` | Texto no vacío, máximos respectivos de 200, 120, 80 y 2000 unidades UTF-16 |
| `date` | Fecha real `AAAA-MM-DD`, años 0001–9999 |
| `status` | `ok` o `attention` |
| `findings` | Entero entre 0 y 10000 |
| `version`, `baseVersion` | Enteros seguros; versión ≥ 1 y 0 ≤ base < versión |
| `updatedAt` | Fecha real UTC `AAAA-MM-DDTHH:mm:ss.sssZ` |

Los textos permiten Unicode, tabulación y saltos de línea; rechazan los demás
controles ASCII. React muestra texto, sin insertar HTML crudo. Las etiquetas de
estado se conservan como texto de presentación compatible con el contrato anterior.
El sobre acepta solo `clientId`, `version`, `baseVersion`, `record`; el registro
remoto contiene los ocho campos de inspección y sus tres metadatos. Identidad y
versión deben coincidir con el sobre. Las respuestas del servidor también se
validan: una respuesta inesperada no confirma ni sobrescribe datos locales.

`request.ts` exige `application/json` (415), rechaza JSON/UTF-8 inválidos (400)
y limita el cuerpo a 32 KiB (413), contando bytes reales aunque no se declare
`Content-Length`. Los errores no reflejan la entrada recibida.

## Secretos

La revisión del código de la app y de los archivos públicos no encontró claves
privadas, tokens ni credenciales. La app solo consulta `NODE_ENV` en el middleware;
no necesita secretos ni configuración pública. No hay bloque `env` de Next.
`environment.mjs`, importado únicamente por `next.config.mjs`, impide iniciar o
compilar si existe cualquier variable `NEXT_PUBLIC_*`. Una excepción futura
necesita una lista explícita y revisión. Los errores no imprimen valores.

Los futuros secretos deben consumirse solo en servidor y nunca incluirse en
propiedades del cliente, respuestas, registros, datos de inspección ni `public/`.
`.gitignore` ya excluye `.env*`, excepto `.env.example`. La revisión y esta
barrera no certifican ausencia de secretos en historial o infraestructura.

## CSP y cabeceras

`headers.ts` y `src/middleware.ts` generan un nonce aleatorio de 128 bits por
respuesta y reemplazan cualquier CSP enviada por el cliente. Next recibe la misma
política y asigna el nonce a sus scripts. El layout se renderiza por petición
para que cada documento coincida con su cabecera CSP, con el costo de renderizado
dinámico en servidor.

- Recursos, conexiones, manifest y service worker limitados al propio origen.
- Scripts internos con nonce; scripts por atributos y `eval` bloqueados en
  producción. Desarrollo permite `unsafe-eval` y WebSocket local para Next.
- Imágenes propias o `blob:` para fotos temporales. CSS interno con nonce;
  atributos de estilo permitidos para los límites de carga de Next/React.
- Objetos, marcos, medios por URL y cambios de URL base bloqueados; formularios
  propios y prohibida la inclusión de la app en marcos.

`next.config.mjs` entrega `nosniff`, `DENY`, `no-referrer`, HSTS por un año sin
subdominios/preload y `X-Robots-Tag: noindex, nofollow, noarchive`. El navegador
solo aplica HSTS sobre HTTPS. El despliegue debe ofrecer HTTPS y conservar las
cabeceras. Se elimina `X-Powered-By`.

La caché v3 retira las versiones anteriores al activarse el nuevo service worker.
Offline se reutilizan juntos el documento y su cabecera CSP, con el nonce
original. La caché sigue siendo exclusivamente para la demostración sintética.

## Permisos y rastreo

Las APIs de cámara y ubicación se invocan solo al pulsar los botones, nunca al
importar módulos, montar páginas o sincronizar. La cámara pide solo video y
detiene sus pistas al terminar o fallar. Ante denegación se permite continuar
sin foto o elegir un archivo. La alternativa ya no incluye `capture`, que podía
abrir otra vez la cámara en móviles. Las fotos son temporales y no se sincronizan.

La ubicación se obtiene una sola vez, sin seguimiento ni alta precisión. Si se
deniega, se conserva la ubicación escrita y se permite editarla manualmente.
`Permissions-Policy` limita cámara y ubicación al propio origen y deshabilita
micrófono, pagos y USB. La cabecera no solicita ni concede permisos.

`public/robots.txt` pide no rastrear ninguna ruta de la PWA académica. Es público
y voluntario: no autentica, autoriza ni protege información. El endpoint sigue
siendo sintético, sin identidad de usuario y con almacenamiento temporal.


La implementación se limita a los controles del integrante 2. Las pruebas,
la evidencia de regresiones y la integración de CI corresponden al integrante 3.
Implementación asistida por Codex; cada integrante debe revisar y poder explicar
los controles antes de entregar.
