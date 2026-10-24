# Informe mensual de trazas — motor de métricas

Objetivo: automatizar la sección 1 (análisis de trazas de navegación) del informe
mensual de la empresa a partir de los logs diarios de Squid, reproduciendo las
métricas del informe vigente (SARG 2.x).
Rama: `feat/monthly-report-traces` · Estrategia: work-unit commits · Runner: `pnpm test` (Vitest).

## Specs

- **S1** — El sistema ingiere los archivos diarios de logs de Squid que el
  especialista importa. El transporte soporta archivos que exceden el límite de
  body de una server action (1 MB), por lo que la ingesta será por stream
  (route handler) o por CLI. Cada archivo se identifica por su hash SHA-256 y
  reimportarlo no duplica datos.
- **S2** — El sistema reproduce las métricas del informe vigente, generado por
  SARG 2.x: `Hits`, `Incoming (MB)`, `Outgoing (MB)`, `Download Time (h:m:s)`,
  `Browsing Time (h:m:s)`, `% of Hits`.
- **S3** — El formato de salida es exacto: enteros con separador de miles
  (`129,351`), megabytes con 2 decimales (`3,676.86`), tiempos `h:m:s` sin tope
  de 24 horas (`699:52:18`), porcentajes a 1 decimal (`0.1%`, `0.0%`).
- **S4** — Clasificación de sitios: nacional = TLD `.cu` menos una lista
  configurable de dominios institucionales excluidos (UNE, MINEM, DNC);
  internacional = el resto.
- **S5** — Detección de las categorías prohibidas del informe: pornográfico o
  adultos, C/R o subversivos, proxys anónimos, minería de criptomonedas. Cada
  coincidencia produce evidencia (URL, usuario, primera y última vez) y una
  disposición: `PENDING | CONFIRMED | FALSE_POSITIVE | ACTION_TAKEN`.
- **S6** — El sistema emite el documento completo de 7 secciones. Las secciones
  2-7 se emiten presentes y vacías: encabezado, numeración y tablas con sus
  cabeceras, celdas sin contenido.
- **S7** — El informe declara cobertura: días esperados vs días importados, y
  cantidad de hits sin cuenta de proxy identificada. Un mes con días faltantes
  no puede aprobarse sin declararlo.
- **S8** — No existe tabla IP→usuario. Los usuarios se autentican en el proxy
  contra el AD (Windows Server 2022) y el username viaja en el log (`%[un`).
- **S9** — Las cuentas del proxy son personales (política de la empresa): una
  cuenta = una persona. Una cuenta sin registro no se descarta: se conserva el
  username crudo y se cuenta en la cobertura.
- **S10** — Día y mes se calculan en la zona horaria local (`America/Havana`);
  Squid emite epoch UTC. El corte de mes y el día local no pueden depender de
  la zona del servidor.
- **S11** — Gate de paridad: el motor regenera las métricas de mayo 2026 y debe
  coincidir con `IM EE Matanzas mayo 2026.docx`. Sin este gate no se emite un
  informe oficial.
- **S12** — `Browsing Time` es una métrica derivada, no un campo del log. Su
  umbral de sesión es configurable y debe calibrarse contra SARG; si no se
  reproduce exacto, el informe declara la aproximación.
- **S13** — Todo importar, generar, aprobar y exportar queda auditado con los
  hashes de los artefactos.

## Tasks

- **T1** — Documento de seguimiento. Route: inline. Status: hecho.
- **T2** — Contrato de formato (`lib/reports/format.ts`) + tests. Route: inline. Spec: S3.
- **T3** — Día local con zona explícita (`lib/reports/time.ts`) + tests. Route: inline. Spec: S10.
- **T4** — Parser de `access.log` con columnas configurables (`lib/reports/parser/`) + tests. Route: inline. Spec: S2, S8.
- **T5** — Clasificación de sitios nacional/internacional/webmail (`lib/reports/classify/`) + tests. Route: inline. Spec: S4.
- **T6** — Motor de reglas por categoría (`lib/reports/rules/`) + tests. Route: inline. Spec: S5.
- **T7** — Agregación diaria con semántica SARG (`lib/reports/metrics/`) + tests. Route: inline. Spec: S2, S7, S12.
- **T8** — Esquema Prisma de informes + migración. Route: inline. Spec: S1, S5, S7, S13.
- **T9** — Servicio de ingesta (stream, hash, idempotencia). Bloqueado por Gate 0 (formato real).
- **T10** — Paridad mayo 2026. Bloqueado por Gate 0 (salida de SARG).
- **T11** — Plantilla `.docx` + `docx-templates` + PDF. Bloqueado por plantilla oficial.
- **T12** — UI de importación, revisión de hallazgos y documento. Pendiente.

Route declaration: todas las tareas de esta sesión son `inline` — no hay unidades
independientes en paralelo ni presión de contexto que justifiquen un writer.

## Log

### L1 — Pedido original (verbatim)

> el proposito de la creacion de la nueva page @app/(protected)/dashboard/monthly-report-management/ es automatizar el proceso creacion de informes mensuales en mi empresa, te doy mas detalles, soy epspecialist en seguridad informatica en mi empresa, y todos los meses tengo que enviar un informe (docuemnto pdf), que muestra datos de las trazas de navegacion de los usuarios a traves de squid proxy que esta implementado en un server de la empresa, entonces, quiero automatizarlo para no tener que hacerlo manual, el informe debe llenarse con los datos que el usuario (yo-especialista en seguridad informatica) importa en el sistema, entonces por otro lado tengo emplementado en un server de la empresa , graylog, el cual recibe los logs de squid, y tengo configurado en el servidor un srcip y un cron para que guarde en un directorio, los logs nativos que graylog recibe y procesa, se crea un arvhivo por dia en ese directorio, entonces necesito que me ayudes a crear un plan para implementar esot, que opinas, no modifiques nada, solo estamos en una etapa de planificacion

### L2 — Corrección de identidad (verbatim)

> los usuarios se autentican en el proxy a traves de los usuarios de addc en windows server 2022 de mi empresa, por lo tanto en los logs si estan los nombres de usuario

Efecto: elimina la tabla IP→usuario del diseño (S8).

### L3 — Evidencia del informe vigente

Se analizó `IM EE Matanzas mayo 2026.docx`. Hallazgo: la sección 1 son tablas
HTML de SARG 2.x pegadas en Word (columnas `Hits`, `Incoming (MB)`,
`Outgoing (MB)`, `Download Time (h:m:s)`, `Browsing Time (h:m:s)`, `% of Hits`,
más drill-down por sitio). Consecuencia: el objetivo no es inventar un formato
sino reproducir métricas (S2) y validar paridad (S11).

Evidencia de que `Browsing Time` no es tiempo de reloj: la cuenta `red.social2`
acumula `726:14:18` en un mes de 720 horas; los tiempos por sitio de un usuario
no suman su total. Por eso S12.

### L4 — Corrección de cuentas (verbatim)

> una politica de la empresa es que las cuents son personales, es decir no existe en teoria cuentas comaprtidas porque cada usuario tiene una

Efecto: sin `kind` compartido/servicio en el registro de cuentas (S9).

### L5 — Alcance del documento (verbatim)

> apunta desde el principio al documento completo para evitar pegado manual aunque las secciones fuera del alcance se deben mantener vacias

Efecto: S6.

### L6 — Autorización de implementación

> adelante con la implementacion entonces

### L7 — Decisiones técnicas tomadas

- El parser interpreta columnas por posición declarada, con el logformat
  estándar de Squid (`squid`) como default. Cambiar el orden es configuración,
  no reescritura: no se codifica contra un formato adivinado.
- Se descarta regex en las reglas de categoría (riesgo de ReDoS); se usan
  `DOMAIN`, `SUFFIX` y `CONTAINS`.
- La agregación es por día local y luego rollup; nunca se persisten líneas
  crudas (130 M/mes estimados a partir de `% of Hits` del informe).
- `Browsing Time` se acumula por par (sitio, usuario) en orden cronológico con
  umbral de corte configurable; el total por usuario es la suma de sus pares,
  que es lo que explica los valores mayores a 720 h.

### L8 — Evidencia de esta sesión

Pendiente de completar al cerrar la sesión.
