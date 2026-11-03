# Informe mensual — plantilla oficial v2

Objetivo: adaptar el módulo del informe mensual a la nueva plantilla oficial
(`/home/roger/Proyecto de Informe Mensual de Ciberseguridad.docx`).
Rama: `feat/monthly-report-template-v2` · Estrategia: work-unit commits · Runner: `pnpm test` (Vitest).

## Specs

- **S1** — La plantilla oficial es el `.docx` nuevo. Se sanitiza **una sola vez**
  (no en cada generación): el ejemplar que entregó el usuario está lleno con
  datos de octubre (`Informe Mensual de Ciberseguridad. Octubre 2026 v. Final.`,
  `2 / 11/ 2026`, `9/ 11/ 2026`, `No __X__`, `Cantidad de acciones realizadas:
  ___0____`, años `2026`). La copia sanitizada reemplaza
  `storage/templates/monthly-report.docx`; la anterior se archiva como
  `monthly-report-v1.docx`; el archivo original no se toca. `TEMPLATE_VERSION`
  sube a `2`. La plantilla no se versiona en git (`storage/` está ignorado):
  el despliegue la copia por `scp`, como hoy.
- **S2** — El documento conserva sus 21 tablas, A4, una sección, tres
  encabezados con logos y toda la prosa oficial. El generador **solo** llena
  las tablas 6, 7 y 8 (y la 4 en la unidad siguiente). No existe vaciado
  genérico: las secciones manuales quedan tal como están en la plantilla
  sanitizada. Se retira `document/blank-sections.ts`.
- **S3** — Campos del período, con fallo explícito si falta un ancla:
  - título: `Informe Mensual de Ciberseguridad. <Mes> <Año> v. Final.`
  - `Período del Informe:` → `01/MM/AAAA al DD/MM/AAAA`
  - `Fecha de Emisión:` → fecha de generación en `America/Havana`, `DD/MM/AAAA`
  - cierre: `Y para que así conste se firma la presente a los <d> días del mes de <mes> del año <año>`
  - los literales `202_` y `2026` de los huecos manuales se reemplazan por el
    año del período; `2021` (Resolución 105/2021) no se toca.
- **S4** — Tabla 6, "Sitios web más visitados": top **5** por `Browsing Time`
  del sitio (no por hits), excluyendo telemetría; columnas `No.`, `URL`,
  `Tiempo total (hh.mm)` y `Cantidad de usuarios` (usuarios distintos del mes).
  Es una sola tabla: no hay separación nacional/internacional.
- **S5** — Tabla 7, "Usuarios con más tiempo de navegación": top **5** por el
  reloj del usuario; `Usuario` y `Nombre y apellidos`. El nombre se busca en
  `AccountRequest` por `username` (comparación sin distinguir mayúsculas), con
  fallback a `ProxyAccount.displayName`; sin coincidencia queda vacío.
- **S6** — Tabla 8, "Usuarios con más descargas": top **5** por `bytesIn`;
  `Total descargado` en MB o GB. Mismo criterio de nombre que S5.
- **S7** — Formatos: `formatHoursMinutes` escribe `H.MM` (horas sin relleno,
  minutos con dos dígitos, segundos truncados) y `formatSize` escribe
  `X.XX MB` o `X.XX GB` (desde 1 GiB). El resto del formato del informe no
  cambia (`formatInteger`, `formatMegabytes`, `formatDuration`,
  `formatPercentage`).
- **S8** — `generateMonthlyReport` carga los perfiles de `AccountRequest` para
  los usernames del período y los pasa como entrada; `buildMonthlyDocument`
  sigue siendo puro y no consulta la base.
- **S9** — Tabla 4, "Incidencias detectadas": filas desde los hallazgos
  persistidos, con `No`, URL, categoría legible, usuario, nombre, cargo y
  `Medidas Técnicas` (`ReportFinding.measure`). Se excluyen los falsos
  positivos. Se agrega la categoría `MALWARE` a `RuleCategory` (enum + migración
  + etiquetas de UI). Las cinco preguntas de incidencias se marcan `Si __X__` /
  `No __X__` según haya hallazgos de esa categoría; las subpreguntas de
  "Reporte de Incidencia al GST. UNE" quedan manuales.
- **S10** — Para que la regeneración incluya las medidas revisadas, la
  generación persiste los hallazgos, los vuelve a leer con su disposición y
  medida, y después arma el documento. El orden archivo/fila se mantiene: el
  `.docx` se escribe antes de actualizar la fila.
- **S11** — Verificación: tests unitarios de formatos, armado, emisión, período
  y modelo; un documento dorado contra la plantilla real; la suite completa,
  `tsc` y `eslint`. El piloto es octubre 2026 renderizado a PDF con LibreOffice
  y comparado contra el ejemplar.
- **S12** — Despliegue: actualizar `DEPLOYMENT_GUIDE.md` y `README.md` con la
  plantilla v2, y copiar el archivo sanitizado a producción. Un informe ya
  emitido conserva su `.docx`; regenerarlo usa la plantilla vigente.

**Fuera de alcance (decisión L2):** no se automatizan los bloques de cuentas
(webmail, correo, resumen de ordenadores/usuarios, Directorio Activo). Tampoco
antivirus, USB, vulnerabilidades, SIEM, respaldos ni firmas.

## Tasks

- **T1** — Documento de seguimiento y espejo en Engram. Route: inline. Status: hecho.
- **T2** — Plantilla sanitizada v2, `TEMPLATE_VERSION=2` y archivo de la v1. Route: inline. Spec: S1. Status: hecho (`e22e41b`; asset local en `storage/templates/`, v1 en `monthly-report-v1.docx`).
- **T3** — Formatos `H.MM` / MB-GB, armado de las tres tablas y perfiles. Route: inline. Spec: S4-S8. Status: hecho (`e22e41b`).
- **T4** — Mapa de tablas 6/7/8, campos del período, ancla de la declaración y retiro del vaciado. Route: inline. Spec: S2, S3. Status: hecho (`e22e41b`).
- **T5** — Tests de T2-T4 y documento dorado. Route: inline. Spec: S11. Status: hecho (`e22e41b`, `3095efe`; PDF piloto de octubre verificado con LibreOffice).
- **T6** — Tabla 4, categoría `MALWARE`, checkboxes y orden de generación. Route: inline. Spec: S9, S10. Status: pendiente.
- **T7** — Piloto octubre, suite/`tsc`/`eslint` y despliegue. Route: inline. Spec: S11, S12. Status: pendiente.

## Log

### L1 — Pedido original (verbatim)

> actualmente cambio completamente la plantilla del informe mensual, a partir de ahora se va a usar esta de manera oficial /home/roger/Proyecto de Informe Mensual de Ciberseguridad.docx, entonces hay que adaptar todo el modulo a esta nueva, que opinas, analizala y genera un plan para la implementacion

### L2 — Alcance de cuentas (verbatim)

> no los incluyas, estamos listos para comenzar o es necesario verificar algo mas???

Decisión: los bloques de cuentas (webmail, correo, resumen de ordenadores/usuarios,
Directorio Activo) quedan manuales. Se implementan solo las tablas 4, 6, 7 y 8
y las cinco preguntas de incidencias.

### L3 — Autorización de arranque (verbatim)

> commitea los camios pendientes y luego arranca

### L4 — Análisis de la plantilla

- 21 tablas (antes 22), A4, una sección, tres encabezados con logos, sin tablas
  anidadas. Solo se reescribe `word/document.xml`, así que logos y encabezados
  se conservan.
- El ejemplar está lleno con octubre 2026: sanitizarlo es obligatorio.
- Automatizables: T4 (incidencias), T6 (sitios), T7 (usuarios por tiempo),
  T8 (usuarios por descargas) y las cinco preguntas de incidencias.
- Manuales: T1-T3 (acciones y planes), T5 (otros incidentes), T9-T13 (webmail y
  USB), T14 (antivirus), T15-T16 (vulnerabilidades), T17 (SIEM), T18
  (respaldos), T19 (resumen), T20-T21 (firmas).
- La regla de `blank-sections` (cortar en el último `:`) destruiría
  `durante el periodo: Si ____ No ____`; se retira.
- `period.ts` actual falla: sus tres anclas no existen en la plantilla nueva.
- Falta `MALWARE` en `RuleCategory`; `ProxyAccount.displayName/position` nunca
  se llenan; los nombres y cargos salen de `AccountRequest`.
- Formatos nuevos: `hh.mm` y MB/GB; top 5. Se eliminan del documento las tablas
  nacional/internacional, los drill-downs y la sección de redes sociales.

### L5 — Puesta a punto

- Cambios pendientes commiteados en `feat/account-request-letter-template`:
  `900e284` docs, `002d98f` seed, `ecb184e` reports browsing time, `3c6ab19`
  settings.
- Rama nueva `feat/monthly-report-template-v2` desde `main` (`c1c20fd`).
  Baseline: 259 tests pasan, 9 saltados.
- Supuestos registrados: "sitios más visitados" ordena por `Browsing Time` (la
  columna que muestra); `hh.mm` se escribe `H.MM` (ej. `266.34`); la tabla 6
  incluye sitios nacionales e internacionales.

### L6 — Unidad 1 (plantilla + trazas)

- `e22e41b` adapta el documento: tablas 6/7/8, campos del período, ancla de la
  declaración, retiro de `blank-sections`, perfiles desde `AccountRequest` con
  fallback a `ProxyAccount`, y `TEMPLATE_VERSION=2`.
- `3095efe` agrega la prueba contra la plantilla real (se salta si el asset no
  está, como en CI).
- Verificación local: 234 tests pasan, 9 saltados; `tsc` y `eslint` limpios.
  Piloto octubre 2026 renderizado a PDF: título, rango, emisión, las tres
  tablas, la declaración y el cierre salen correctos; no queda ningún dato de
  octubre del ejemplar.
- El archivo v1 quedó en `storage/templates/monthly-report-v1.docx`; la v2
  sanitizada reemplazó `monthly-report.docx`. `storage/` sigue fuera de git.
- Pendiente (T6): tabla 4 de incidencias, `MALWARE`, checkboxes y reordenar la
  generación para que las medidas revisadas entren al documento.
