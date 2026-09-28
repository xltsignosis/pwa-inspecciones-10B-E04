# Decisión de renderizado CSR/SSR — Semana 04

## Contexto

La aplicación muestra el mismo dominio de datos sintéticos en dos rutas: un
listado de inspecciones y el detalle de una inspección. La actividad pide
comparar renderizado del lado del servidor y del lado del cliente, incluyendo
estados verificables de carga, error y contenido, sin introducir servicios
privados ni datos personales.

## Decisión

Se usa un **Server Component** para `/inspecciones` y un **Client Component**
para `/inspecciones/[id]`.

El listado importa `src/lib/data/inspections.ts` y produce el contenido en el
servidor. Por eso el HTML inicial contiene ubicaciones, fechas y enlaces aunque
el JavaScript del cliente todavía no se haya ejecutado. Como la fuente actual
es local e inmutable, Next.js puede optimizar la ruta como contenido estático
durante el build. Esta optimización conserva la propiedad que se quiere medir:
los datos ya están presentes en el HTML recibido. Si en el futuro la lista
dependiera de datos por petición, se deberá usar una consulta sin caché o una
política de revalidación explícita.

El detalle declara `"use client"` y solicita
`/api/inspecciones/[id]` dentro de `useEffect`. Esto permite observar estados
reales de carga, respuesta 404 y error de red, además de ofrecer un reintento.
El estado inicial siempre es `loading`, tanto en el HTML generado por Next.js
como en el primer render del navegador. No se usan `window`, `Date.now()` ni
`Math.random()` durante ese render, lo que evita diferencias de hidratación.
Un `AbortController` cancela la petición cuando cambia el identificador o se
desmonta el componente.

`src/components/loading-state.tsx` se comparte entre las dos rutas. Es un
componente sin estado y sin `"use client"`; acepta `loading`, `empty` o `error`
y usa semántica accesible:

- `role="status"`, `aria-live="polite"` y `aria-busy="true"` durante la carga;
- `role="status"` para el resultado vacío;
- `role="alert"` y `aria-live="assertive"` para el error.

Las acciones de recuperación no viven en el componente compartido. La ruta
cliente conserva el botón **Reintentar** porque es quien conoce cómo repetir la
petición; el componente solo presenta el estado y su mensaje.

## Comparación y trade-offs

| Aspecto | Listado: servidor | Detalle: cliente |
|---|---|---|
| HTML inicial | Incluye los datos de las inspecciones | Incluye el estado de carga; los datos llegan después |
| JavaScript requerido para ver datos | No | Sí |
| Estado de error de red observable | Limitado con la fuente local actual | Sí, mediante el `fetch` real |
| Accesibilidad inicial | El contenido es legible desde la primera respuesta | El estado de carga se anuncia y después se actualiza |
| Complejidad | Menor: lectura y renderizado directos | Mayor: efecto, unión de estados, cancelación y reintento |
| SEO y clientes sin JavaScript | Más favorable | El detalle no aparece sin ejecutar JavaScript |

La ruta de servidor se eligió para la vista que ayuda a descubrir y navegar
registros. La ruta cliente se eligió para demostrar interacción y recuperación
ante fallos. No se adopta CSR para todo el flujo porque aumentaría el trabajo
del navegador y ocultaría el listado del HTML inicial; tampoco se adopta
renderizado de servidor para ambas rutas porque se perdería la comparación y
los estados de red verificables solicitados.

## Verificación reproducible

La prueba `tests/rendering.spec.ts` realiza dos tipos de comprobación:

1. Verifica que el listado siga siendo un Server Component, obtenga los datos
   sintéticos y produzca enlaces de detalle. El build de Next.js valida su
   renderizado con el runtime real del framework.
2. Revisa los invariantes críticos del detalle CSR: directiva `"use client"`,
   carga con `useEffect`, estado inicial determinista, `fetch`, 404, cancelación
   y reintento. También renderiza los tres estados compartidos y comprueba sus
   anuncios accesibles.

Comandos:

```bash
npx tsx tests/rendering.spec.ts
npm run build
npm run verify
```

Con el servidor de producción iniciado se puede comparar el HTML crudo:

```bash
curl -s http://localhost:3000/inspecciones | grep -c "Laboratorio de Redes"
curl -s http://localhost:3000/inspecciones/inspection-001 | grep -c "Laboratorio de Redes"
```

El primer comando debe producir al menos una coincidencia. El segundo debe
producir cero porque el contenido del detalle llega después mediante `fetch`.
Como métrica repetible de carga se registra la tabla de rutas que imprime
`npm run build`: tamaño propio y **First Load JS** de `/inspecciones` y
`/inspecciones/[id]`. En la verificación local de esta integración con Next.js
14.2.35 se obtuvieron estos valores:

| Ruta | Clasificación de Next.js | Tamaño | First Load JS |
|---|---|---:|---:|
| `/inspecciones` | `○ Static` | 140 B | 87.4 kB |
| `/inspecciones/[id]` | `ƒ Dynamic` | 1.38 kB | 88.6 kB |

El detalle agrega aproximadamente 1.24 kB de código propio y 1.2 kB al First
Load JS de la ruta porque incorpora estado, efecto, petición, cancelación y
reintento en el cliente. Estos valores deben volver a copiarse desde el build
del SHA final, ya que pueden cambiar al modificar dependencias o componentes.

## Límites y riesgos

- Los tres registros son sintéticos y no existe base de datos ni API externa.
- El error del listado es difícil de provocar mientras su fuente sea un arreglo
  local; la prueba confirma la rama, pero no simula una caída de servidor.
- La página CSR responde inicialmente como documento válido aunque la API del
  registro termine en 404; ese 404 pertenece a la petición de datos.
- Sin JavaScript, el detalle permanece en carga y no muestra su contenido.
- El Service Worker puede responder desde su caché a una consulta previamente
  visitada; una prueba manual de error debe bloquear o limpiar esa respuesta.
- Las comprobaciones estructurales protegen decisiones de arquitectura, pero
  una mejora futura es añadir una prueba E2E en navegador para validar la
  hidratación y la recuperación de red de extremo a extremo.

## Consecuencias

La solución favorece contenido inicial y navegación en el listado, a cambio de
mayor lógica y dependencia de JavaScript en el detalle. Los estados compartidos
mantienen mensajes y semántica consistentes sin obligar al Server Component a
convertirse en Client Component. La decisión deberá revisarse si los datos se
vuelven sensibles, cambian por usuario o requieren actualización en tiempo real.
