# Rediseño de la UI del módulo de informes mensuales

Objetivo: optimizar el flujo del usuario final, corregir los títulos verbosos y
la copia técnica, y cerrar los defectos de accesibilidad del módulo.
Rama `feat/monthly-report-traces`. Runner `pnpm test`. Sin cambios en el motor de
métricas ni en el documento emitido.

## Specs

- **S1** — Período único. `/new` tiene un solo selector de mes y año que gobierna
  la importación y la generación. Por defecto, el mes local actual.
- **S2** — Títulos congelados: los H2 son exactamente `Importar logs diarios` y
  `Generar el informe`; el KPI de tiempo se llama exactamente `Browsing Time`.
  El resto de los títulos puede cambiar.
- **S3** — Cobertura antes de generar. `/new` muestra `N de M días cargados` con
  los días faltantes, calculada con `checkCoverage` sobre los días importados.
  Se actualiza al cambiar el período y al terminar una importación.
- **S4** — Con cobertura incompleta se puede generar igual, con un aviso
  visible: el documento declara la cobertura incompleta (S7 del informe).
- **S5** — H1 de `/new`: `Preparar el informe de <mes>` con el mes del período.
- **S6** — H1 del detalle: `<Mes> <año>`, por ejemplo `Octubre 2026`.
- **S7** — El ciclo de vida sale de la interfaz: no se muestra el estado ni en la
  lista ni en el detalle. El enum y la columna se conservan con su valor por
  defecto; no se borra ningún dato ni migración.
- **S8** — Sidebar: `Preparar mes`.
- **S9** — Card del panel: `Informes mensuales` / `Preparar y revisar el informe
  del mes`.
- **S10** — KPI `Descartes y telemetría` pasa a `Registros excluidos`, con el
  mismo desglose.
- **S11** — Descarga: `Descargar informe`.
- **S12** — `loading.tsx`: `Cargando…`.
- **S13** — Nada de jerga de implementación en la interfaz: no se muestran
  `SHA-256`, `stream`, `1 MB`, ni el detalle de cómo funciona la importación.
- **S14** — Accesibilidad: todo control tiene etiqueta asociada; la barra de
  progreso expone `role="progressbar"` y `aria-valuenow`; el conmutador
  Archivo/Carpeta expone `aria-pressed`; cada tabla lleva `<caption>`.
- **S15** — Regenerar pide confirmación explícita antes de sobrescribir el
  documento emitido (`details`/`summary`, sin JavaScript).
- **S16** — Revisión en bloque de hallazgos: filtros por categoría y por estado
  de revisión, y una acción para aplicar una disposición a varios hallazgos a la
  vez. Los contadores muestran el total, no el subconjunto filtrado.
- **S17** — Ninguna ruta nueva: la cobertura se pide con una server action de
  lectura. `/summary` sigue redirigiendo.
- **S18** — `/new` lista los archivos ya cargados del período (nombre, líneas,
  días que aporta y fecha de carga), para que la cobertura no sea un número
  huérfano: se distingue "faltа subir" de "se cortó".
- **S19** — Cerrar o recargar la pestaña con una importación en curso pide
  confirmación.
- **S20** — Salir de la pantalla cancela la importación en curso. No hay datos a
  medias: cada archivo se escribe en una sola transacción, y lo ya importado
  queda reimportable sin duplicar (SHA-256).

## Tasks

- **T1** — `coverageSummary` en `lib/reports/coverage-text.ts` + test (S3).
  Status: hecho (`df9d0c3`); 7 casos, incluidos los tramos comprimidos.
- **T2** — `listImportedDays` en `lib/reports/persistence/load.ts` (S3).
  Status: hecho (`df9d0c3`); cubierto por una prueba de base con `REPORTS_DB_TEST=1`.
- **T3** — `reportCoverageAction` y `updateFindingsAction` en `actions.ts` (S3, S16).
  Status: hecho (`df9d0c3`); las dos pasan por `requireAdmin`.
- **T4** — `PrepareMonth` + `/new` con período único y panel de cobertura (S1, S3-S5).
  Status: hecho (`df9d0c3`).
- **T5** — Detalle: título por período, filtros, revisión en bloque, confirmación
  de regeneración, etiquetas accesibles (S6, S7, S10, S11, S14-S16).
  Status: hecho (`df9d0c3`).
- **T6** — Lista sin estado, sidebar, card, `loading` y copia (S7-S13).
  Status: hecho (`df9d0c3`).
- **T7** — Archivos cargados, aviso al cerrar y cancelación al desmontar (S18-S20).
  Status: hecho (`9029122`).

## Log

### L1 — Pedido inicial (verbatim)

> bien, ahora, vamos con el siguiente punto sbre la ui y ux, vamos a refinalrlos
> y hacer mas accesible y lo mas optimo posible en cuanto al flujo de trabajo del
> usuario final, es decir, reordenar o volver a estructurar si es necesario para
> optimizar el flujo, ademas de que tienes que valorar si agregar alguna otra
> nueva ruta o vista o funcionalidad, tambien evalua los titulos ya que,
> actualmente esta demasiado verbosos y tecnicos y de cara al usuario final no lo
> encuentro conveniente

### L2 — Decisiones del especialista (verbatim)

> vamos por puntos:
> 1.Deja los siguientes titulos como estan actualmente, los demas que o mencione
> si los actualuzas: h2 importar, h2 generar, Browsing time
> 2.todavia no incluyas el cilo de vida, es mas eliminalo por ahora , lo
> implmentamos depsues si te lo pido.
> Todas las demas sugerencias, si aplicalas

Se aplica S2 (títulos congelados) y S7 (el ciclo de vida sale de la interfaz,
sin tocar el modelo). El resto del paquete propuesto entra completo.

### L3 — Implementación (evidencia)

Cambios aplicados: panel de cobertura previo con el período único (`PrepareMonth`),
títulos y copia sin jerga, filtros y revisión en bloque de hallazgos, confirmación
antes de regenerar, etiquetas accesibles y `loading` en español. El ciclo de vida
sale de la lista y del detalle; el enum y la columna quedaron intactos (S7).

Verificación: `tsc` limpio, 259 tests (8 omitidos), `eslint` 0 errores, `next
build` compila. `REPORTS_DB_TEST=1`: 4/4 en `persistence/import.test.ts`, incluida
la prueba nueva de `listImportedDays` contra la base real (días 2099-01-01 a
2099-01-03). Sobre los datos de octubre: 18 días cargados de 31, que el panel
resume como `1–8 y 27–31`.

Pendiente: revisar las pantallas en el navegador. No hay pruebas de render ni
e2e para las páginas; lo verificado es tipos, compilación y la lógica con pruebas.

### L4 — Importación interrumpida (pregunta del especialista)

Pregunta: qué pasa si se importa una carpeta y el usuario navega a otra página.
Respuesta verificada en el código: cada archivo es atómico (`$transaction` después
del parseo completo), así que nunca hay días a medias ni duplicados; lo que se
perdía era la visibilidad. Antes, una navegación interna dejaba el bucle de subida
corriendo a espaldas del usuario, y cerrar la pestaña destruía los archivos en
vuelo sin aviso.

Aplicado: `listPeriodFiles` (S18), confirmación con `beforeunload` (S19) y
`AbortController` al desmontar (S20). Recuperación: volver a elegir la carpeta
reimporta solo lo que falta; los archivos ya cargados responden "Ya estaba
importado".

Verificación: `tsc` limpio, 259 tests, `eslint` 0 errores, `next build` compila.
`REPORTS_DB_TEST=1`: 12/12 en `persistence/`, incluida la prueba nueva de
`listPeriodFiles` (lista los archivos del período y no hereda los del mes vecino).
