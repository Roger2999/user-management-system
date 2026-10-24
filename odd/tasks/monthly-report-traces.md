# Informe mensual de trazas — motor de métricas

Objetivo: automatizar la sección 1 (análisis de trazas de navegación) del informe
mensual de la empresa a partir de los logs diarios de Squid, reproduciendo las
métricas que hoy exporta WebSpy Giga Analyzer.
Rama: `feat/monthly-report-traces` · Estrategia: work-unit commits · Runner: `pnpm test` (Vitest).

## Specs

- **S1** — El sistema ingiere los archivos diarios de logs de Squid que el
  especialista importa. El transporte soporta archivos que exceden el límite de
  body de una server action (1 MB), por lo que la ingesta será por stream
  (route handler) o por CLI. Cada archivo se identifica por su hash SHA-256 y
  reimportarlo no duplica datos.
- **S2** — El sistema reproduce las métricas de las tablas que hoy se exportan
  de WebSpy Giga Analyzer: `Hits`, `Incoming (MB)`, `Outgoing (MB)`,
  `Download Time (h:m:s)`, `Browsing Time (h:m:s)`, `% of Hits`.
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
  umbral de sesión es configurable y debe calibrarse contra WebSpy; si no se
  reproduce exacto, el informe declara la aproximación.
- **S13** — Todo importar, generar, aprobar y exportar queda auditado con los
  hashes de los artefactos.
- **S14** — El parser acepta las dos formas de registro que conviven en el
  archivo real: la primaria del logformat declarado y la variante CONNECT sin
  estado ni tamaño. La variante se cuenta aparte porque esos túneles no aportan
  bytes, y esa falta debe ser visible en la calidad del dato.
- **S15** — El drill-down por sitio ordena por `Browsing Time` descendente (no
  por hits) y su `% of Browsing Time` se calcula sobre el tiempo de navegación
  del sitio atribuido a cuentas identificadas.
- **S16** — La tabla "Los 10 usuarios que más descargaron" se ordena por
  `Browsing Time` descendente, aunque el título diga otra cosa, y su porcentaje
  se calcula sobre el tiempo de navegación total del mes.
- **S17** — Para cada sitio seleccionado se persisten **todos** sus pares
  (sitio, usuario), no solo el top 10. El recorte a 10 filas ocurre al renderizar:
  truncar al persistir rompería el denominador de S15 y los porcentajes dejarían
  de coincidir con el documento.

## Tasks

- **T1** — Documento de seguimiento. Route: inline. Status: hecho (`a85a8b5`).
- **T2** — Contrato de formato (`lib/reports/format.ts`) + tests. Route: inline. Spec: S3. Status: hecho (`670c02a`).
- **T3** — Día local con zona explícita (`lib/reports/time.ts`) + tests. Route: inline. Spec: S10. Status: hecho (`670c02a`).
- **T4** — Parser de `access.log` con columnas configurables (`lib/reports/parser/`) + tests + fragmento real como fixture. Route: inline. Spec: S2, S8, S14. Status: hecho (`20bb01e`, variante CONNECT en `8de35b6`).
- **T5** — Clasificación de sitios nacional/internacional/webmail (`lib/reports/classify/`) + tests. Route: inline. Spec: S4. Status: hecho (`2efa0a2`).
- **T6** — Motor de reglas por categoría (`lib/reports/rules/`) + tests. Route: inline. Spec: S5. Status: hecho (`2efa0a2`).
- **T7** — Agregación diaria con la semántica de las tablas del informe (`lib/reports/metrics/`) + tests. Route: inline. Spec: S2, S7, S12. Status: hecho (`58ac620`).
- **T8** — Esquema Prisma de informes + migración. Route: inline. Spec: S1, S5, S7, S13. Status: hecho (`b00c317`). Migración creada pero **no aplicada**: `prisma migrate deploy` es una mutación de base de datos y queda a decisión del usuario.
- **T13** — Armado de las tablas de la sección 1 (`lib/reports/assembly/`) + test dorado contra el documento. Route: inline. Spec: S15, S16, S17. Status: hecho.
- **T9** — Servicio de ingesta (stream, hash, idempotencia). Status: bloqueado por Gate 0 (logformat real) y por verificación contra base de datos.
- **T10** — Paridad mayo 2026. Status: bloqueado por Gate 0 (informes exportados de WebSpy).
- **T11** — Plantilla `.docx` + `docx-templates` + PDF. Status: bloqueado por la plantilla oficial.
- **T12** — UI de importación, revisión de hallazgos y documento. Status: pendiente.

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
con columnas `Hits`, `Incoming (MB)`, `Outgoing (MB)`, `Download Time (h:m:s)`,
`Browsing Time (h:m:s)`, `% of Hits`, más drill-down por sitio. Consecuencia: el
objetivo no es inventar un formato sino reproducir métricas (S2) y validar
paridad (S11).

_La atribución de esas tablas a SARG que figuraba en esta entrada era
incorrecta; la herramienta real es WebSpy Giga Analyzer (ver L9)._

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

Implementado y verificado:

- `lib/reports/format.ts` + test: reproduce los valores del documento
  (`129,351`, `3,676.86`, `699:52:18`, `0.1%`, `0.0%`).
- `lib/reports/time.ts` + test: el corte de día se hace en `America/Havana`;
  el 2026-05-01T03:00Z cae en `2026-04-30`.
- `lib/reports/parser/squid-log.ts` + test: logformat declarado por columnas;
  un orden distinto al archivo rechaza las líneas en vez de interpretarlas mal;
  las líneas en blanco no cuentan y las inválidas se contabilizan.
- `lib/reports/classify/site.ts` + test: `CONNECT host:port`, IPv6, `.cu` con
  exclusiones por etiqueta completa (`notune.cu` no coincide con `une.cu`).
- `lib/reports/rules/matcher.ts` + test: `DOMAIN`/`SUFFIX`/`CONTAINS`, sin regex.
- `lib/reports/metrics/aggregate.ts` + test: hits, bytes, elapsed, browsing por
  par (sitio, usuario) con umbral de corte, y subidas por método.
- `prisma/schema.prisma` + migración `20261024120000_add_monthly_reports`:
  8 tablas nuevas, sin `ALTER` ni `DROP` sobre tablas existentes.

Verificación: `pnpm test` 86/86 en 10 archivos; `tsc --noEmit` sin errores.

Pendiente y bloqueado:

- `Browsing Time` sigue sin calibrar contra WebSpy (S12). El default de 30 minutos
  es una hipótesis, no una verdad medida.
- El logformat es el estándar de Squid por default; confirmar contra el archivo
  real antes de la T9.
- La migración no se aplicó (mutación de base de datos, decisión del usuario):
  `pnpm exec prisma migrate deploy`.
- El cambio sin commitear en `layout.tsx` es del usuario y no se tocó.

### L9 — Corrección: la herramienta es WebSpy Giga Analyzer (verbatim)

> aclaracion importante, las columnas no provienen de SARG, sino de WebSpay Giga Analizer, detallo el flujo actual que tengo, importo los logs en la herramienta webspy, de ahi genero los informes para cada tabla que el informe oficial que te proporcione requiere, entonces de los informes generados por webspy copio y pego en ese informe oficial, dime si entendiste

Flujo real: logs de Squid → importación en WebSpy → un informe por tabla →
copiar y pegar en el documento oficial.

Efecto sobre el plan:

- **S2 y S12 se reescriben**: la referencia de paridad es WebSpy, no SARG.
- **Gate 0 cambia dos artefactos**: el perfil de importación de WebSpy (orden de
  campos con que interpreta el log) en lugar de `sarg.conf`, y los informes de
  mayo exportados de WebSpy en lugar de su salida HTML.
- **El motor no cambia de estructura**: parser configurable, contrato de formato
  y agregación siguen siendo válidos. Cambia contra qué se calibra, no el diseño.
- **Queda registrado** que el mensaje del commit `58ac620` dice "semantica de
  SARG"; la atribución correcta es WebSpy. El historial no se reescribe.

### L10 — Fragmento real de log y verificación aritmética del documento

Fragmento aportado: 12 líneas, y **dos formas de registro**:

- 11 líneas con el logformat de 10 campos.
- 1 CONNECT de 8 campos (`... CONNECT github.com:443 - HIER_DIRECT/140.82.114.4 -`),
  que el parser rechazaba a propósito.

La decisión fue declarar la variante en lugar de aflojar la validación: se acepta
solo cuando la cantidad de campos no coincide, se cuenta aparte y entra con
`bytes: 0`, porque el archivo no trae tamaño para esos túneles. Implementado en
`8de35b6`. El fragmento quedó como fixture
(`lib/reports/parser/fixtures/squid-access-sample.log`) y el pipeline completo se
prueba sobre él: 12/12 válidas, 0 inválidas, 1 variante CONNECT, 52,780 bytes,
11,247 ms de `elapsed`, 10 hits sin cuenta.

El campo de jerarquía llega como `HIER_DIRECT` / `HIER_NONE`, no `DIRECT` /
`NONE`. Se conserva tal cual: no se interpreta.

#### Verificación aritmética del documento vigente

1. **El drill-down ordena por Browsing Time, no por hits.** En `www.youtube.com`,
   `infojovellanos` (6,522 hits) va antes que `brian` (7,002 hits) porque navegó
   más tiempo (33:25:00 contra 30:43:34).

2. **"Los 10 usuarios que más descargaron" tampoco ordena por descarga.**
   `red.social2` (47,321.10 MB) aparece antes que `amaury` (604,006.72 MB). El
   orden real es Browsing Time descendente.

3. **`% of Browsing Time` usa dos denominadores distintos.** En el drill-down es
   el tiempo del sitio; en la tabla de top usuarios es el tiempo total del mes.
   En `www.facebook.com` el drill-down cierra **al segundo**: el total de la tabla
   de sitios `146:16:38` = 526,598 s, y `marketing` 110,074 / 526,598 = 20.9%. Las
   diez filas se reproducen exactas en el test dorado de
   `lib/reports/assembly/section-traces.test.ts`.

4. **Inconsistencia real en el documento vigente.** En youtube, bing e instagram
   los porcentajes del drill-down no cierran contra el Browsing Time impreso en
   la tabla de sitios:

   | Sitio | Browsing del sitio | Cálculo directo | Impreso | Denominador implicado |
   |---|---|---|---|---|
   | www.facebook.com | 146:16:38 | 20.9% | 20.9% ✓ | 146:16:38 |
   | www.youtube.com | 266:34:32 | 12.5% | 15.4% | 216:59:29 |
   | www.bing.com | 53:56:25 | 14.7% | 21.1% | 37:29:13 |
   | www.instagram.com | 157:52:37 | 12.1% | 46.5% | 40:56:27 |

   Hipótesis que explica los cuatro casos: el denominador del drill-down es el
   tiempo del sitio **atribuido a cuentas identificadas**, mientras que el valor
   de la tabla de sitios incluye tráfico sin autenticar (los túneles CONNECT
   anónimos, como la línea 5 del fragmento). Facebook es un sitio con login, no
   tiene anónimo, y por eso coincide exacto.

   **No confirmado.** Sin la exportación de WebSpy no se puede verificar. Queda
   como pregunta abierta **R2** y la resuelve el gate de paridad. De ahí S15 y
   S17: el recorte a 10 filas va al renderizar, nunca al persistir, porque
   truncar al persistir rompe el denominador.

5. **`% of Hits` es consistente con un total mensual de ~91.3M hits.** Con ese
   total, youtube 129,351 da 0.1% y picta.cu 639,073 da 0.7%, ambos impresos.

6. El documento trae una anotación manual antes de la tabla nacional
   (`{excluir páginas web alojadas en servidores del Organismo. (UNE, MINEM, DNC)`).
   No es contenido generado: no se emite, pero la regla queda registrada como
   exclusión configurable (S4).

#### Pendiente

- Confirmar R2 con la exportación de WebSpy.
- Calibrar el umbral de `Browsing Time` (S12) contra el mismo export.
- La ingesta (T9) sigue bloqueada: `db.prisma.io` no es alcanzable desde este
  equipo, así que no hay forma de verificar escrituras contra una base real.
