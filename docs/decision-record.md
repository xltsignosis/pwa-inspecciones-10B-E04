# ADR-001 — Decisión sobre la estrategia de aplicación

> ADR significa registro de decisión arquitectónica. Este documento explica la comparación de alternativas, la elección del equipo y sus consecuencias para el caso de inspecciones de laboratorio de la UTT.

## Estado

Aceptada por el equipo 10B-E04 el 5 de septiembre de 2026. Aplica a la trayectoria del curso; se revisará en las semanas en que se implementen `manifest`, service worker y sincronización.

## Contexto y restricciones

- **Usuarios.** Personal técnico que inspecciona laboratorios y responsable de mantenimiento que consulta los hallazgos para priorizar su atención (ver `docs/requirements.md`, sección 2).
- **Conectividad.** El trabajo ocurre dentro de laboratorios donde la red puede ser inestable. El Escenario 2 de `docs/requirements.md` exige capturar una inspección sin conexión y sincronizarla al reconectar (RF-04, RF-05, RF-14, RF-15).
- **Uso.** Dispositivos heterogéneos: computadoras de escritorio para consulta (Escenario 1) y equipos móviles durante el recorrido. No hay un parque de dispositivos homogéneo ni administración centralizada.
- **Datos.** Solo datos sintéticos durante la etapa de demostración (sección 5 de `docs/requirements.md`); sin datos personales reales.
- **Equipo y curso.** Tres estudiantes durante un cuatrimestre. El curso ya define Next.js y una trayectoria PWA, y el equipo desarrolla en ese stack. No hay presupuesto ni cuentas de desarrollador para publicar en tiendas de aplicaciones.
- **Alcance de la Semana 1.** Conservar el starter funcionando y documentar; no se implementan `manifest`, service worker, offline, sincronización, notificaciones ni autenticación.

## Alternativas consideradas

| Criterio | PWA (elegida) | Web tradicional | App nativa (Android/iOS) | App multiplataforma (React Native / Flutter) |
|---|---|---|---|---|
| **Instalación** | Se instala desde el navegador (icono en pantalla de inicio) sin pasar por una tienda; también funciona como pestaña. | No se instala; siempre se abre en el navegador. | Requiere descarga desde la tienda y revisión previa de la plataforma. | Igual que nativa: distribución por tiendas y revisión. |
| **Conexión intermitente / offline** | Con service worker, caché e IndexedDB permite consultar los últimos datos y encolar capturas offline; cubre el Escenario 2. Hay que **diseñar** ese almacenamiento y la sincronización: no aparece por usar React/Next. | Sin conexión no carga ni guarda; no cubre el Escenario 2. | Soporte offline sólido, pero exige implementar almacenamiento y sincronización con SDK del sistema. | Soporte offline mediante librerías del framework; también requiere diseñar la sincronización. |
| **Distribución y actualización** | Se comparte por URL; al recargar, todos usan la última versión. | Igual que PWA: por URL y actualización inmediata. | Publicación y actualizaciones sujetas a revisión de la tienda y a que el usuario actualice. | Igual que nativa para la distribución; un solo código, pero pipelines por plataforma. |
| **Costo de desarrollo** | Un solo código web; el equipo ya conoce Next.js/React por el curso. | El más bajo, pero renuncia a offline e instalación. | El más alto: Kotlin/Swift y una base de código por plataforma; lenguajes nuevos para el equipo. | Un framework nuevo (Dart/Flutter o RN); un código, pero configuración nativa y tooling adicional. |
| **Mantenimiento** | Un despliegue y un pipeline de verificación (`npm run verify` / GitHub Actions ya presente). | Un despliegue. | Varias bases de código y procesos de publicación. | Un código, pero builds firmados y cuentas de tienda por plataforma. |
| **Acceso a capacidades del dispositivo** | Cámara, almacenamiento local, geolocalización y notificaciones cubren los requisitos del caso (evidencia fotográfica RF-13, almacenamiento local RF-04). Notificaciones push e instalación tienen límites en iOS. | Limitado a lo que expone el navegador en una sesión; sin persistencia confiable. | Acceso completo a sensores y APIs del sistema. | Acceso casi completo mediante plugins del framework. |
| **Riesgos principales** | Soporte desigual en iOS (push, cuota y desalojo de almacenamiento, vida del service worker); requiere HTTPS; la instalación es menos visible para el usuario. | No satisface offline ni instalación: incumple requisitos centrales. | Costo y plazo incompatibles con un equipo de tres en un cuatrimestre; distribución dependiente de tiendas. | Curva de aprendizaje de un framework nuevo y complejidad de build que no aporta valor que el caso exija hoy. |

No se construyeron prototipos de las cuatro opciones; la comparación es analítica y se apoya en los requisitos ya definidos.

## Decisión

El equipo adopta una **PWA construida con Next.js**, conservando el starter actual.

Justificación frente a las restricciones:

1. **Conectividad intermitente (restricción central).** El Escenario 2 y los RF-04/RF-05/RF-14/RF-15 exigen captura y sincronización offline. Una web tradicional queda descartada; una PWA cubre el requisito con service worker + IndexedDB + cola de sincronización, sin necesidad de tiendas.
2. **Dispositivos heterogéneos y consulta en escritorio.** El mismo código responde en PC (Escenario 1) y en móvil durante el recorrido, sin mantener binarios por plataforma.
3. **Equipo y calendario.** Tres estudiantes en un cuatrimestre, ya productivos en Next.js/React por el curso. Nativa o multiplataforma implicarían lenguajes y pipelines nuevos sin un beneficio que el caso necesite ahora.
4. **Distribución sin fricción.** Reparto por URL y actualización inmediata; no hay cuentas de desarrollador ni revisión de tienda.
5. **Capacidades suficientes.** Cámara y almacenamiento local del navegador cubren la evidencia fotográfica (RF-13) y la persistencia offline (RF-04).

**Cuándo otra alternativa sería preferible.** Si el producto requiriera escaneo intensivo de códigos, sensores especializados, BLE/NFC, operación totalmente offline por periodos prolongados o notificaciones push confiables en iOS, una app nativa o multiplataforma justificaría su costo. Con los requisitos actuales, no es el caso.

Comparar las alternativas no implica cambiar de stack ni implementarlas: la entrega sigue en Next.js.

## Consecuencias y riesgos

**Beneficios**

- Un solo código y un solo despliegue; el pipeline de verificación (`npm run verify`, GitHub Actions) ya existe.
- Actualización inmediata para todos los usuarios al recargar.
- Reutilización del conocimiento del equipo en el stack del curso.

**Costos y trabajo que asumimos**

- Diseñar e implementar el service worker, la estrategia de caché, el almacenamiento local (IndexedDB) y la cola de sincronización. Conservar datos en el dispositivo permite continuidad sin conexión, pero exige manejar la reconciliación al reconectar.

**Riesgos y mitigaciones**

| Riesgo | Mitigación |
|---|---|
| Conflictos al reconectar (dos ediciones del mismo registro). | Identificador generado en el cliente + envío idempotente; regla de resolución explícita (p. ej. última escritura gana) documentada antes de implementar RF-05/RF-15. |
| Cuota y desalojo del almacenamiento del navegador. | Solicitar almacenamiento persistente (`navigator.storage.persist()`), limitar el volumen local y avisar al usuario del estado de sincronización (RF-14). |
| Soporte de push e instalación en iOS. | No hacer depender el flujo crítico de push; usar indicadores visibles en la interfaz para registros pendientes. |
| Pérdida de datos si el usuario limpia el navegador antes de sincronizar. | Sincronizar en cuanto vuelva la conexión y mostrar de forma prominente los registros pendientes. |
| Requisito de HTTPS y de un entorno de despliegue. | Usar un hosting con HTTPS por defecto; documentar la URL de despliegue en el README cuando exista. |

## Validación

Estas comprobaciones se realizarán en las semanas correspondientes; **todavía no se han ejecutado** porque offline, service worker y sincronización aún no están implementados.

1. **Prueba offline (Escenario 2).** Con las herramientas de red del navegador desactivar la conexión, verificar que se consultan los últimos datos y que una captura queda guardada localmente (RF-04); reconectar y comprobar que el registro se sincroniza una sola vez (RF-05, RF-15).
2. **Auditoría de instalabilidad.** Ejecutar Lighthouse (categoría PWA) y confirmar `manifest` válido y service worker activo.
3. **Rendimiento (RNF de `docs/requirements.md`).** Con 100 registros sintéticos, medir cinco cargas del listado en el dispositivo y navegador declarados; meta: menos de 2 s en al menos 4 de 5.
4. **Accesibilidad (RNF).** Recorrido con teclado y revisión con herramientas del navegador sobre los flujos de consulta y captura.

Si estas mediciones no se cumplen, se revisará esta decisión: en particular, un fallo persistente de almacenamiento u offline en los dispositivos objetivo abriría la evaluación de una alternativa multiplataforma.
