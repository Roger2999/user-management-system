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
  informe oficial. **Excepción (S20):** la selección de sitios no se compara
  contra mayo, porque ese documento no sigue la regla del top 10 por hits ni en
  la tabla internacional ni en la nacional. Se usa como referencia de formato.
- **S12** — `Browsing Time` es una métrica derivada, no un campo del log. Tiene
  **dos relojes independientes**: el del sitio y el del par (sitio, usuario). Cada
  uno tiene su umbral de sesión configurable y deben calibrarse contra WebSpy por
  separado; si no se reproducen exactos, el informe declara la aproximación.
- **S13** — Todo importar, generar, aprobar y exportar queda auditado con los
  hashes de los artefactos.
- **S14** — El parser acepta las dos formas de registro que conviven en el
  archivo real: la primaria del logformat declarado y la variante CONNECT sin
  estado ni tamaño. La variante se cuenta aparte porque esos túneles no aportan
  bytes, y esa falta debe ser visible en la calidad del dato.
- **S15** — El drill-down por sitio ordena por `Browsing Time` descendente (no
  por hits) y su `% of Browsing Time` se calcula sobre la **suma del `Browsing
  Time` de todos los usuarios del sitio** —la fila `Total` del export de usuarios
  de WebSpy—, que **no** es el `Browsing Time` que la tabla de sitios muestra para
  ese sitio. Confirmado con los exports de mayo 2026: bing `37:25:15` (134,715 s),
  instagram `40:58:59` (147,539 s), facebook `146:33:51` (527,631 s), frente a
  `53:56:25`, `157:52:37` y `146:16:38` en la tabla de sitios.
- **S16** — La tabla "Los 10 usuarios que más descargaron" se ordena por
  `Browsing Time` descendente, aunque el título diga otra cosa, y su porcentaje
  se calcula sobre el tiempo de navegación total del mes.
- **S17** — Para cada sitio seleccionado se persisten **todos** sus pares
  (sitio, usuario), no solo el top 10. El recorte a 10 filas ocurre al renderizar:
  truncar al persistir rompería el denominador de S15 y los porcentajes dejarían
  de coincidir con el documento.
- **S18** — El `Browsing Time` del sitio y el del par (sitio, usuario) se
  acumulan por separado, cada uno con su propio reloj y umbral. El del sitio no se
  obtiene sumando los pares: los pares se solapan en el tiempo y la suma no
  reproduce el valor del sitio.
- **S19** — El período es el **mes calendario local** del mes que se importa
  (`01` al último día, en `America/Havana`); no se deduce de los archivos
  presentes ni se extiende a 32 días. Un día faltante se reporta como faltante,
  y un día fuera del período —como el 30/04 en un informe de mayo— se reporta
  como ajeno al período en lugar de sumarse.
- **S20** — Las dos tablas de sitios de la sección 1 las calcula el sistema: no
  se declaran. Internacional = top 10 por hits descendente; nacional = top 10
  por hits descendente, aplicando las exclusiones institucionales de `S4`. El
  `Browsing Time` **no** selecciona sitios: es la métrica del drill-down, donde
  ordena a los 10 usuarios de cada sitio (S15). Los drill-downs son los sitios
  de la tabla internacional, en ese mismo orden. El informe de mayo 2026 no es
  oráculo de la selección: su tabla internacional no es el top 10 por hits
  (omite `google.com` e incluye sitios muy por debajo del corte) y la nacional
  también está intervenida a mano.
- **S21** — Los diez drill-downs usan la misma cabecera y la misma métrica:
  `Users | Hits | Incoming (MB) | Download Time (h:m:s) | Browsing Time (h:m:s) |
  % of Browsing Time (h:m:s)`. No existe variante por hits, aunque el documento
  de mayo la tenga en `clarity.ms` y `windy.com`.
- **S22** — El documento se emite fechado y con el mes del período: la fecha es la
  de generación en `America/Havana`, la línea "Informe mensual correspondiente al
  mes" lleva el mes y el año informados, y la prosa de la sección 1 menciona ese
  mismo mes. No puede quedar el mes de la plantilla.

## Tasks

- **T1** — Documento de seguimiento. Route: inline. Status: hecho (`a85a8b5`).
- **T2** — Contrato de formato (`lib/reports/format.ts`) + tests. Route: inline. Spec: S3. Status: hecho (`670c02a`).
- **T3** — Día local con zona explícita (`lib/reports/time.ts`) + tests. Route: inline. Spec: S10. Status: hecho (`670c02a`).
- **T15** — Período mensual y cobertura de días (`monthlyPeriod`, `checkCoverage`) + tests. Route: inline. Spec: S19. Status: hecho (`74a62a6`).
- **T4** — Parser de `access.log` con columnas configurables (`lib/reports/parser/`) + tests + fragmento real como fixture. Route: inline. Spec: S2, S8, S14. Status: hecho (`20bb01e`, variante CONNECT en `8de35b6`).
- **T5** — Clasificación de sitios nacional/internacional/webmail (`lib/reports/classify/`) + tests. Route: inline. Spec: S4. Status: hecho (`2efa0a2`).
- **T6** — Motor de reglas por categoría (`lib/reports/rules/`) + tests. Route: inline. Spec: S5. Status: hecho (`2efa0a2`).
- **T7** — Agregación diaria con la semántica de las tablas del informe (`lib/reports/metrics/`) + tests. Route: inline. Spec: S2, S7, S12, S18. Status: hecho (`58ac620`, reloj del sitio separado después).
- **T8** — Esquema Prisma de informes + migración. Route: inline. Spec: S1, S5, S7, S13. Status: hecho (`b00c317`). Migración creada pero **no aplicada**: `prisma migrate deploy` es una mutación de base de datos y queda a decisión del usuario.
- **T13** — Armado de las tablas de la sección 1 (`lib/reports/assembly/`) + test dorado contra el documento. Route: inline. Spec: S15, S16, S17. Status: hecho (`29516e1`, cabeceras normalizadas en `3c3b3bc`).
- **T16** — Regla de "sitios más visitados" (S20): las dos tablas se calculan
  como top 10 por hits (`selectTopSites`) y los drill-downs se atan a la tabla
  internacional. Route: inline. Spec: S20, S21. Status: hecho, sin verificación
  ejecutada fuera del shim (ver L18, L19).
- **T18** — Contenedor `.docx` sin dependencias (`lib/reports/document/zip.ts`,
  `docx.ts`): lectura y escritura del ZIP sobre `node:zlib` con CRC-32 propio, y
  reemplazo de una sola parte dejando las demás intactas. Route: inline. Spec:
  S6. Status: hecho (ver L20), verificado contra el documento de mayo.
- **T19** — Emisión de la sección 1 sobre el documento real
  (`lib/reports/document/emit.ts`): reemplaza las tablas 4, 5–14, 15 y 16,
  normaliza cabecera y ancho de los dos drill-downs exportados por hits, y
  elimina los sobrantes con su título. Route: inline. Spec: S2, S6, S21.
  Status: hecho (ver L20), verificado por píxeles contra el documento de mayo.
- **T20** — Vaciado de las secciones 2-7 (`lib/reports/document/blank-sections.ts`):
  conserva encabezados, numeración, etiquetas y cabeceras de tabla, y borra los
  valores del mes anterior. Route: inline. Spec: S6. Status: hecho (ver L21),
  verificado contra el documento de mayo.
- **T21** — Campos del período (`lib/reports/document/period.ts`): fecha de emisión
  en `America/Havana`, mes y año del período y mención del mes en la prosa de la
  sección 1. Route: inline. Spec: S10, S22. Status: hecho (ver L22), verificado
  contra el documento de mayo.
- **T22** — Composición del documento (`lib/reports/report.ts`): plantilla + trazas
  + período → `.docx`. Route: inline. Spec: S6, S22. Status: hecho (ver L23),
  verificado contra el documento de mayo.
- **T17** — Modelo mensual: merge de días, cobertura y declaraciones (`lib/reports/model/monthly.ts`). Route: inline. Spec: S7, S12, S19. Status: hecho.
- **T14** — Arnés de paridad: fixture numérico con los totales de los exports de WebSpy (sitios + usuarios por sitio) y comparación por sitio contra el motor. Route: inline. Spec: S11, S15. Status: nivel 1 hecho (`1307188`); nivel 2 bloqueado por el `access.log` de mayo.
- **T10** — Paridad mayo 2026. Status: desbloqueado en parte — los exports de WebSpy ya están y confirman el denominador de S15; falta el `access.log` completo de mayo (incluido el 30/04) para comparar hits, bytes y tiempos.
- **T9** — Servicio de ingesta (stream, hash, idempotencia). Route: inline. Spec: S1, S10, S19. Status: la parte pura está hecha (`lib/reports/ingest.ts`, ver L24): stream → métricas por día local, con los días ajenos declarados. Faltan el hash, la idempotencia y la persistencia, que dependen de la base de datos.
- **T11** — Emisión del documento oficial: contenedor (T18), tablas de la sección
  1 (T19) y secciones 2-7 vacías (T20). Route: inline. Spec: S2, S6, S21.
  Status: hecho el `.docx`. La conversión a PDF queda fuera del sistema: se hace
  con LibreOffice o Word, y no se automatiza en esta unidad.
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

- R2 resuelta en L11.
- Calibrar los dos relojes de `Browsing Time` (S12) contra los exports: los
  valores objetivo ya existen, falta el `access.log` completo.
- Decidir el rango del período (R3, S19).
- La ingesta (T9) sigue bloqueada: `db.prisma.io` no es alcanzable desde este
  equipo, así que no hay forma de verificar escrituras contra una base real.

### L11 — Exportaciones de WebSpy: R2 resuelta y dos hallazgos nuevos

El usuario aportó las exportaciones del informe de mayo (WordML con extensión
`.doc`): `2026-06-04 Sites Export.doc` y siete `Users Export(...)` (bing, cd4o,
facebook, fbsbx, instagram, kimi, mediafire).

#### 1. R2 confirmada: el denominador del drill-down es la suma de los usuarios

Cada export de usuarios trae una fila `Total` con el `Browsing Time` completo del
sitio, y los porcentajes de las filas cierran contra **ese** total, no contra el
`Browsing Time` de la tabla de sitios:

| Sitio | `%` del primer usuario | Denominador implicado | `Total` del export de usuarios | Tabla de sitios |
|---|---|---|---|---|
| www.bing.com | 21.1% (`dtor.fre`) | 134,953 s | **134,715 s** ✓ | 194,185 s |
| www.instagram.com | 46.5% | 147,387 s | **147,539 s** ✓ | 568,357 s |
| www.facebook.com | 20.9% (`marketing`) | 526,670 s | **527,631 s** ✓ | 526,598 s |

Los tres coinciden dentro del redondeo a un decimal. La hipótesis de L10 era
correcta en el denominador, pero su explicación no: no se trata de tráfico
anónimo. En bing los hits del export de usuarios (`12,574`) son **exactamente**
los de la tabla de sitios, o sea que todo el tráfico está atribuido a las 45
cuentas, y aun así el `Browsing Time` difiere: `37:25:15` contra `53:56:25`.

#### 2. Hallazgo nuevo: el `Browsing Time` del sitio no es la suma de sus usuarios

Es una **segunda métrica distinta**, no la misma agregada de otra forma:

| Sitio | Browsing del sitio | Suma de sus usuarios | Cociente |
|---|---|---|---|
| www.facebook.com | 526,598 s | 527,631 s | 0.998 |
| www.youtube.com | 959,672 s | 781,169 s | 1.23 |
| www.bing.com | 194,185 s | 134,715 s | 1.44 |
| www.instagram.com | 568,357 s | 147,539 s | 3.85 |

Y la relación no puede ser "el sitio incluye anónimos": la suma por usuario es
**mayor** que el sitio en facebook. Eso es consistente con relojes paralelos
—cada usuario acumula su propio hueco, y los huecos de usuarios simultáneos se
solapan—, mientras que el reloj del sitio ve un solo flujo de marcas de tiempo.
El cociente desigual en bing e instagram indica además que WebSpy no usa el mismo
umbral en los dos niveles.

Consecuencia: el código calculaba el `Browsing Time` del sitio sumando los pares.
Era incorrecto. Ahora hay dos acumuladores independientes
(`siteBrowsingGapMs` y `browsingGapMs`), con tests que prueban que divergen
(`aggregate.test.ts`: 20 min del sitio contra 30 min de los pares para el mismo
tráfico). El algoritmo exacto de WebSpy sigue sin reproducirse: queda como R1.

#### 3. Hallazgo nuevo: el "mes de mayo" cubre 32 días

```
Export of a drilldown by Organization
Date range: 30/04/2026 - 31/05/2026 (32 days)
WebSpy Analyzer Giga 2.3
```

El informe vigente incluye el **30 de abril**. Consecuencias:

- Para reproducir sus números hay que importar también el log del 30/04.
- Mi cobertura por `daysInMonth` (31 días) marcaría ese día como faltante.
- Puede ser deliberado (capturar el tráfico de la noche del 30) o un error de
  configuración del rango en WebSpy. No lo decido yo: queda como R3 y el rango
  pasa a ser un parámetro explícito (S19).

#### 4. Los exports están truncados y el `% of Hits` no es sobre la suma de sitios

- `1. 723 of 12,119 Sites`: el export de sitios muestra 723 de 12,119 sitios.
- Los exports de usuarios también truncan: bing muestra 36 de 45 usuarios,
  instagram 46 de 59, facebook 94 de 103. La fila `Total` sí es completa.
- La fila `Total` del export de sitios suma `1,097,316` hits y marca `1.2%`. Si
  el `%` fuera sobre la suma de los sitios listados, esa fila diría 100%.
  El denominador del `% of Hits` es entonces **todo el tráfico del período**
  (~88–95M hits según el redondeo), no la suma de los sitios: los 723 sitios
  listados apenas cubren el 1.2%.

  Esto confirma que el denominador correcto de `% of Hits` es el total de líneas
  procesadas —incluidas las que no se resuelven a ningún sitio—, que es lo que el
  acumulador ya usa (`totalHits`).

- Los dos exports (sitios a las 10:24, usuarios a las 17:31–18:00) coinciden
  exactamente en hits, MB y `Download Time` de cada sitio, así que la diferencia
  de `Browsing Time` no es una diferencia de datos ni de momento de exportación.

#### Verificación de esta entrada

`pnpm exec vitest run lib/reports`: 74 tests, 9 archivos, en verde.
`pnpm exec tsc --noEmit`: sin errores.

### L12 — Decisión del período: mes calendario (verbatim)

> claro, los logs que se van a importar seran los del correspondiente mes que se
> importe en el sistema, dime si esto responde a tu pregunta anterior

Respuesta: sí, cierra R3. El período es el mes calendario del mes que se importa,
de `01` al último día, en `America/Havana`. No se reproduce el rango histórico de
32 días.

#### Consecuencia que hay que tener presente

El informe de mayo que sirve de oráculo cubre `30/04 - 31/05`. Con un período de
31 días, **la paridad exacta contra ese documento no es alcanzable**: todo sitio
con tráfico el 30/04 va a quedar por debajo, y no se puede saber cuánto sin el
log de ese día.

El gate de paridad (S11) no se debilita: se reemplaza el oráculo. Para comparar
hay que volver a exportar mayo desde WebSpy con rango `01/05/2026 - 31/05/2026`;
ese export sí tiene la misma ventana que el motor. Mientras no exista, la
comparación es contra un documento que mide otra cosa.

Corolario operativo: si el import mensual incluye el archivo del 30/04 —el cron
crea un archivo por día y puede quedar el del día anterior en el directorio— el
sistema lo declara como día ajeno al período (`extraDays`) en vez de sumarlo.

#### Implementado

`monthlyPeriod(year, month)` declara inicio, fin y días esperados;
`checkCoverage(period, presentDays)` devuelve días faltantes y días ajenos al
período. Tests: 5 nuevos, incluido el caso del 30/04 clasificado como ajeno.
`pnpm exec vitest run lib/reports`: 79 tests, 9 archivos, en verde.
`pnpm exec tsc --noEmit`: sin errores.

### L13 — Estructura real del `.docx` y selección de sitios

Se inspeccionó el documento vigente (`IM EE Matanzas mayo 2026.docx`): 22 tablas
en total, con 13 en la sección de trazas.

| Tabla | Contenido |
|---|---|
| T04 | sitios internacionales, 7 columnas, 10 filas |
| T05–T14 | 10 drill-downs de usuario, 6 columnas |
| T15 | "Los 10 usuarios que más descargaron", 7 columnas |
| T16 | sitios nacionales, 7 columnas, 10 filas |

#### 1. Dos drill-downs miden otra cosa

`www.clarity.ms` (T13) y `www.windy.com` (T14) traen la cabecera `% of Hits` y sus
porcentajes son de hits, no de tiempo:

| Sitio | Usuario | Hits | `%` impreso | Cálculo | `%` por browsing |
|---|---|---|---|---|---|
| clarity.ms | amaury | 68 | 11.0% | 68/618 = 11.0% ✓ | 00:28:07 de 01:36:18 = 29.2% |
| windy.com | liudmila | 113 | 23.3% | 113/486 = 23.3% ✓ | 00:01:26 de 00:33:23 = 4.3% |

También cambia el orden: esas dos tablas van por hits descendente, no por
`Browsing Time`. Los otros ocho drill-downs van por tiempo y con `% of Browsing
Time`. Es una inconsistencia de origen —parecen exportes de otro tipo de reporte
de WebSpy—, no una decisión de diseño.

**R4 (abierta):** ¿se reproduce tal cual, como pide "indistinguible del original",
o se normaliza a `Browsing Time` como las otras ocho? Recomendación: normalizar,
porque dos tablas del mismo tipo no pueden medir cosas distintas en un informe
oficial. No se decide sin el usuario.

#### 2. La selección de los 10 sitios no se puede deducir

La tabla internacional (T04) **no** es el top 10 por hits ni por browsing:

- Por hits, 14 sitios internacionales superan al último del informe (`windy.com`,
  486 hits) y ninguno aparece: `google.com` (90,921), `msftconnecttest.com`
  (34,124), `google-analytics.com` (28,440), `googletagmanager.com` (20,519),
  `gstatic.com` (10,749), `msftncsi.com` (7,673), `googleadservices.com` (3,477),
  `googleapis.com` (2,758), `internetdownloadmanager.com` (1,903), `amazon.com`
  (1,340), `temu.com` (1,315), `microsoft.com` (1,193),
  `download.windowsupdate.com` (1,060), `usgs.gov` (773).
- Por `Browsing Time` el orden sería youtube, google, instagram, facebook,
  msftconnecttest, googletagmanager, gstatic, google-analytics, bing,
  googleadservices — tampoco coincide.
- La tabla nacional omite `google.com.cu` (13,323 hits), que supera a todos
  menos a `picta.cu`.

No hay regla de categoría que explique la lista: `clarity.ms` es analítica y
`google-analytics.com` no; `kimi.com` y `mediafire.com` entran y `amazon.com` no.
Es **una elección manual del especialista**.

Consecuencia de diseño (S20): la selección de sitios de las dos tablas es un
dato explícito del informe, no un cálculo. El sistema puede proponer un top por
hits, pero la lista final la confirma el especialista. Sin esto, el informe
automatizado mostraría `msftconnecttest` en lugar de `kimi`.

#### 3. Los exports aportados cubren 7 de los 10 drill-downs

Faltan `www.clarity.ms` y `www.windy.com`... y sobra uno: los aportados son bing,
cd4o, facebook, fbsbx, instagram, kimi y mediafire (7). Para recalibrar hay que
pedir los 10 con el rango `01/05 - 31/05`, incluidos clarity.ms y windy.

#### Pendiente del período

Nada de esto depende del export: la plantilla, el render y la ingesta no lo
necesitan. Solo la paridad numérica lo necesita.

### L14 — Paridad y calibración ajustadas sin el export corregido

Decisión del usuario: ajustar ambas con lo disponible y corregir después si hace
falta, para no frenar el resto.

#### Paridad: se separa en dos niveles

- **Nivel 1, verificado hoy**: formato, orden y denominador contra los siete
  exports de usuarios disponibles. El fixture `lib/reports/parity/exports.fixture.ts`
  guarda hits, bytes, tiempos y porcentajes tal como los publicó WebSpy, sin los
  nombres de usuario; se contrastó fila por fila contra el documento oficial y dio
  **cero diferencias**. Los siete sitios se reproducen exactos, incluidos los
  órdenes con empate en cero (`kimi`, `fbsbx`).
- **Nivel 2, pendiente**: que el motor calcule esas filas desde el `access.log`.
  Es lo que necesita el log del mismo período y lo que queda para el lunes.

Esto es más estricto que el test dorado anterior, que solo cubría facebook: ahora
hay siete sitios y el denominador está probado contra la fila `Total` real.

#### Calibración: se construyó el instrumento, no se adivinó el número

`lib/reports/parity/calibrate.ts` recibe registros y tiempos publicados, y barre
umbrales de 5 a 120 minutos devolviendo el error de cada uno. Reusa
`DailyMetricsAccumulator`, así que calibra exactamente el código de producción.

Propiedad que documenta el test: el umbral **no siempre es identificable**. Con
huecos de 20, 30 y 45 minutos, cualquier umbral entre 30 y 40 reproduce el mismo
total; la calibración devuelve el rango, no un valor único. Inventar un número
exacto sería mentir.

El valor por defecto sigue en 30 minutos y sigue declarado como hipótesis hasta
que la calibración corra contra el log real.

#### Lo que no se tocó

El umbral del sitio (`siteBrowsingGapMs`) no tiene objetivos publicados por
usuario del sitio, solo el total; se calibrará después del primero.

`pnpm exec vitest run lib/reports`: 90 tests, 11 archivos, en verde.
`pnpm exec tsc --noEmit`: sin errores.

### L15 — Reemplazo de tablas sobre el documento real

Se implementó `lib/reports/document/table-xml.ts`: reemplaza las filas de datos de
una tabla de `document.xml` **clonando la fila molde del propio documento**. No se
reconstruye el formato y no se agrega un parser XML ni una dependencia: se heredan
bordes, anchos, fuentes y alineación del original.

#### Verificación de identidad sobre el documento oficial

Se tomó el `.docx` vigente, se reemplazó la tabla 4 (sitios internacionales) con
**los mismos diez valores** que ya tenía, se volvió a comprimir y se convirtió a
PDF con LibreOffice:

| Comprobación | Resultado |
|---|---|
| `soffice` abre y convierte el `.docx` modificado | sí, 11 páginas |
| Tamaño del PDF | 554,474 bytes, idéntico al original convertido |
| Texto extraído (`pdftotext -layout`) | `diff` sin diferencias, 495 líneas |
| Cabecera de la tabla | intacta |
| Ancho de columna | igual: `www.instagram.com` se parte igual que en el original |

Que el texto sea idéntico byte a byte prueba que el clonado no altera el
contenido ni el orden de las celdas. Que el ancho y los saltos coincidan prueba
que tampoco altera el formato.

`pnpm exec vitest run lib/reports`: 98 tests, 12 archivos, en verde.
`pnpm exec tsc --noEmit`: sin errores.

### L16 — R4 resuelta: los diez drill-downs se normalizan (verbatim)

> normalizalos todos a Users
> Hits
> Incoming (MB)
> Download Time (h:m:s)
> Browsing Time (h:m:s)
> % of Browsing Time (h:m:s)

Los diez drill-downs quedan con esa cabecera y con `% of Browsing Time` calculado
sobre el total de usuarios del sitio. Se descarta reproducir la variante por hits
de `clarity.ms` y `windy.com`. Queda registrado como S21.

Consecuencia: en el informe de junio esas dos tablas van a diferir del informe de
mayo en el orden y en el porcentaje. Es una corrección deliberada, no una
regresión.

Consecuencia operativa para el lunes: los exports de `clarity.ms` y `windy.com`
tienen que ser de tipo *Users by Browsing Time*, no *by hits*; si vienen del
segundo tipo no sirven para la paridad.

Guardas agregadas: la cabecera está congelada por test y cada fila emite
exactamente seis columnas en ese orden.

### L17 — Selección explícita de sitios y modelo mensual

#### La selección dejó de calcularse

`buildTracesSection` filtraba por clasificación y cortaba en un top 10 por hits:
eso es exactamente lo que S20 prohíbe, porque el documento vigente no es el top
por hits (`google.com` tiene 90,921 hits y no aparece; `kimi.com` entra con
2,731). Ahora la selección es un parámetro obligatorio:

```ts
selection: { international: string[]; national: string[]; drilldowns: string[] }
```

`proposeSiteSelection` sigue existiendo como punto de partida —el top por hits de
cada clasificación—, pero no es un default: un default silencioso volvería a
calcular la selección. La tabla se ordena por hits descendente, que es el orden
verificado del documento; la selección decide **qué** entra, no en qué orden se
imprime. El drill-down sí respeta el orden declarado porque es una lista aparte.

Guardas: un sitio seleccionado sin tráfico falla con el nombre en el mensaje en
vez de emitir una tabla incompleta; un sitio nacional declarado en la tabla
internacional falla en vez de imprimirse en la tabla equivocada.

#### Modelo mensual

`lib/reports/model/monthly.ts` une los días ya agregados y arma el informe:

- `mergeDailyMetrics` suma usuarios, sitios y pares, y **rechaza un día repetido**
  en vez de duplicar métricas: reimportar un archivo es idempotente o es un error,
  nunca el doble de hits.
- `buildMonthlyReport` filtra al período, declara días faltantes, días ajenos y
  hits sin cuenta, y arma la sección 1 con la selección recibida.
- El denominador del top de usuarios excluye la cuenta sin identificar: la tabla
  ya la excluye y el porcentaje tiene que medir sobre el mismo conjunto.

Declaraciones del informe: `browsingTimeApproximate` (verdadero hasta que los dos
relojes se calibren contra WebSpy) e `incompleteCoverage` (hay días faltantes y el
informe no puede aprobarse sin declararlo, S7).

Límite conocido: el `Browsing Time` se acumula por día, así que una sesión que
cruza la medianoche local se corta en el cambio de día. Es parte de la
aproximación que el informe declara.

#### Verificación

`pnpm exec vitest run lib/reports`: 113 tests, 13 archivos, en verde.
`pnpm exec tsc --noEmit`: sin errores.

Disciplina de test: el test del modelo se escribió después de la implementación.
Al correrlo falló por una expectativa mía sobre el formato de horas
(`1:00:00` contra `01:00:00`), que es el comportamiento correcto de
`formatDuration`; el test se corrigió, no el código.

### L18 — S20 cambia: "sitios más visitados" se define por Browsing Time

> la regla del browsing time, deja de tener como oraculo, pues al parece tiene
> inonsistencias
>
> la regla del browsing time para de los De los sitios más visitados, los 10
> usuarios que más accedieron a cada uno de estos sitios., deja de tener como
> oraculo, pues al parece tiene inonsistencias

#### Qué se verificó antes de cambiar la regla

Se abrieron los archivos reales (`~/Documentos/Informes mensuales/Mayo/`) y se
comparó el `Sites Export` (30/04–31/05/2026, 724 filas) contra el `.docx` de 22
tablas.

- El título de T05 dice literal "De los sitios más visitados, los 10 usuarios
  que más accedieron a cada uno de estos sitios", y T05–T14 corresponden a los
  10 sitios de T04, en el mismo orden. Esa relación queda confirmada.
- El top 10 internacional por `Browsing Time` del export es: youtube
  (266:34:32), google (231:39:24), instagram (157:52:37), facebook (146:16:38),
  msftconnecttest (117:07:47), googletagmanager (95:05:11), gstatic (91:46:48),
  google-analytics (80:37:21), bing (53:56:25), googleadservices (49:02:17).
- Los 10 sitios del documento están en la posición #1, #4, #9, #3, #12, #14,
  #15, #38, #35 y #54 de 651 internacionales. Solo 4 coinciden con el top por
  tiempo; 6 están fuera.
- El orden de T04 es hits descendente, no `Browsing Time`: instagram
  (157:52:37) aparece después de bing (53:56:25).
- El propio documento trae anotaciones manuales "**Filtrar por 'Hits'" antes de
  T04 y antes de T16, que contradicen la regla del `Browsing Time`.

Conclusión: el documento de mayo mezcla criterios. Se deja de usar como oráculo
de esa tabla y manda la regla.

#### Qué cambió

- `selectMostVisitedSites` reemplaza a `proposeSiteSelection`: top `limit` por
  `Browsing Time` descendente (empates por hits y después por nombre). Ya no es
  una propuesta.
- `buildSiteTableRows` recibe `order: "browsing" | "hits"`. La tabla
  internacional usa `browsing`; la nacional conserva `hits`, que es como está
  impresa y no fue parte de la decisión.
- `buildTracesSection` deriva la tabla internacional del top 10 por tiempo y
  arma los drill-downs con **esos mismos sitios, en ese orden**. Acepta
  `internationalSites` como override explícito; la lista nacional sigue siendo
  obligatoria (`nationalSites`).
- `buildMonthlyReport` recibe `nationalSites` (y `internationalSites` opcional)
  en lugar de `SiteSelection`.

Lo que **no** cambia: el `% of Browsing Time` del drill-down sigue dividiendo
sobre el total de usuarios del sitio (S15) y el top de usuarios sigue por tiempo
(S16). La tabla nacional no se toca.

#### Verificación

**No ejecutada.** `node_modules` existe pero está vacío (0 paquetes), así que
`pnpm exec vitest` falla con "vitest not found" y `tsc` tampoco está disponible.
Los tests se actualizaron y se escribieron antes del cambio, pero no se observó
RED ni GREEN en esta sesión. No se declara el cambio verificado.

### L19 — Corrección: las tablas de sitios se calculan por hits (verbatim)

> nono, no puede ser declarada, la tiene que calcular el sistema y si es por
> hits, al igual que las internacionales mas visitadas es por hits y no es
> declarada, ademas de esto hay algo mas declarado?

#### Qué se corrige

L18 leyó mal el alcance del `Browsing Time`. La regla de tiempo aplica a la
sección "De los sitios más visitados, los 10 usuarios que más accedieron a cada
uno de estos sitios" — es decir, a **los usuarios dentro de cada drill-down**,
que es donde el documento divide por `% of Browsing Time` (S15/S16/S21). No
aplica a la selección de sitios.

Las dos tablas de sitios son top 10 **por hits**, calculadas por el sistema:

- internacional: top 10 por hits, sin lista declarada;
- nacional: top 10 por hits, sin lista declarada, aplicando las exclusiones
  institucionales (S4);
- los drill-downs siguen siendo los sitios de la tabla internacional, en ese
  orden.

Esto además es coherente con el documento vigente: T04 y T16 están ordenadas por
hits y llevan la anotación manual "**Filtrar por 'Hits'**". Lo que el documento
de mayo no respeta es la *regla de selección* (su top internacional no coincide
con el top 10 por hits), y por eso se deja de usar como oráculo de la lista.

#### Qué cambió en el código

- `selectMostVisitedSites` (S20 de L18) se reemplaza por `selectTopSites`, que
  devuelve el top `limit` por hits descendente, con empate por nombre.
- `buildSiteTableRows` vuelve a `(sites, totalHits, limit)` y ordena siempre por
  hits; desaparece la opción `order`.
- `buildTracesSection` calcula **las dos** tablas con `selectTopSites` y sigue
  atando los drill-downs a la tabla internacional. Se elimina `selectSites` y
  sus dos errores ("sin tráfico", "clasificación"): con listas derivadas no hay
  nada que validar contra una entrada externa.
- `buildMonthlyReport` pierde `nationalSites` e `internationalSites`; ya no hay
  selección declarada en la entrada del modelo.

#### Consecuencia esperada para junio 2026

Con la regla, la tabla internacional de junio será: youtube (129,351), google
(90,921), msftconnecttest (34,124), google-analytics (28,440), facebook
(27,248), googletagmanager (20,519), bing (12,574), gstatic (10,749),
msftncsi (7,673), instagram (7,341). La nacional: picta.cu (639,073),
cubadebate.cu (16,727), google.com.cu (13,323), bandec.cu (7,741),
segurmatica.cu (4,470), tvcubana.icrt.cu (1,398), trabajadores.cu (1,339),
granma.cu (473), insmet.cu (461), bc.gob.cu (399). Difieren del documento de
mayo; es el resultado de aplicar la regla, no un defecto.

#### Verificación

Igual que L18: **no ejecutada** fuera del shim. `node_modules` está vacío, así
que no corren `vitest` ni `tsc`. Los tres archivos de test actualizados
(`section-traces.test.ts`, `monthly.test.ts`, `parity/exports.test.ts`) pasan
bajo el shim temporal en `/tmp/opencode/reports-check`, y un smoke end-to-end
verificó: top por hits, corte en 10, dos tablas calculadas, drill-downs atados a
la internacional y exclusiones institucionales. Eso **no** es la suite oficial y
no se declara verificado.

### L20 — Contenedor `.docx` y emisión de la sección 1

#### Qué se hizo

- `zip.ts`: lector y escritor ZIP sobre `node:zlib` (`inflateRawSync` /
  `deflateRawSync`) con CRC-32 propio. Sin dependencias nuevas: el mismo criterio
  que `table-xml.ts` con el parser XML.
- `docx.ts`: `readDocumentXml` y `replaceDocumentXml`; reescriben una sola parte y
  dejan las otras 26 intactas.
- `table-xml.ts` gana las operaciones que faltaban: `replaceTableHeaderRow`,
  `setTableHeading`, `removeTableWithHeading`, `copyTableGrid` y
  `readTableHeader`.
- `emit.ts`: `emitTracesSection(documentXml, traces)` con el mapa de tablas
  explícito — 4 internacional, 5–14 drill-downs, 15 usuarios, 16 nacional. Si la
  selección trae más de diez drill-downs falla: la plantilla tiene diez ranuras y
  clonar tablas enteras no está implementado.

#### Dos defectos de formato encontrados y corregidos

1. **Anchos de columna.** `clarity.ms` y `windy.com` vienen exportados por hits:
   su última columna mide 875 twips contra 2255 en las otras ocho. Cambiar solo el
   texto parte la cabecera en cuatro líneas, la tabla crece y corre la paginación
   de todo lo que sigue. Solo esas dos tablas adoptan el `tblGrid` de la primera;
   las otras ocho conservan el suyo, porque copiarlo a todas angostaba la columna
   `Hits` de bing y partía `912` en dos líneas.
2. **Zebra y borde inferior.** Las filas alternan `cnfStyle` (banda impar / banda
   par) y la última lleva `lastRow`, que es lo que dibuja el borde inferior.
   Clonar siempre la primera fila pintaba todas iguales y perdía el borde. Ahora
   se alternan dos moldes y el último renglón se clona de la última fila original.

#### Verificación

- Ida y vuelta del contenedor: 27 partes, 0 faltantes, 0 sobrantes, 0 con bytes
  distintos; PDF de 554,474 bytes y 495 líneas de texto idénticas al original.
- Emisión con los valores de mayo sobre el documento de mayo: 11 páginas en ambos.
  Comparación por píxeles a 100 dpi: páginas 1-3 y 7-11 idénticas; 4-6 difieren
  solo en las dos cabeceras normalizadas y en el ancho que eso impone a la columna
  de usuarios (`infojovellano` se parte igual que en las otras ocho tablas).
- Suite: 126 tests en 15 archivos; `tsc --noEmit` limpio.

#### De paso

S20 citaba `S22`, que entonces no existía: las exclusiones institucionales están
en S4. Corregido en las dos referencias. (`S22` se usa hoy para los campos del
período, ver L22.)

#### Lo que no se tocó

`.npmrc` y `pnpm-workspace.yaml` traen cambios del entorno de instalación y no se
commitean acá. `layout.tsx` sigue con el cambio pendiente del usuario.

### L21 — Secciones 2-7: se conservan las etiquetas (verbatim)

#### La decisión

S6 dice "presentes y vacías: encabezado, numeración, tablas con sus cabeceras,
celdas sin contenido". La lectura literal vacía también las etiquetas de plantilla
("Cantidad de Usuarios Autorizados:", "Medidas tomadas:"), y el especialista
tendría que reescribirlas cada mes. Se preguntó y la respuesta fue:

> Conservar etiquetas, vaciar valores

#### La regla

Sobre la prosa de las secciones 2-7, en este orden:

1. párrafo con `@` (correos) → se vacía;
2. párrafo que es solo un identificador en mayúsculas (nombres de PC) → se vacía;
3. se borra lo escrito dentro de los huecos de guiones bajos
   (`detectados__10___` → `detectados_______`, `_X__SI` → `____SI`);
4. se corta en el último `:` y se conserva la etiqueta;
5. un guion suelto al final se descarta (relleno de "sin dato").

Un párrafo sin separador se conserva: es prosa de plantilla.

Sobre las tablas se declara, por tabla, cuántas filas de arriba son cabecera:

| Tabla | Contenido | Cabeceras | Filas de datos |
|---|---|---|---|
| 18 | anclaje USB | 2 | 1 |
| 19 | nombres de virus (lista) | 0 | 10 |
| 20 | vulnerabilidades | 1 | 9 |
| 21 | alertas del IDS | 1 | 1 |
| 22 | resumen de la entidad | 3 | 1 |

Las filas de datos se conservan y sus celdas quedan vacías: la tabla mantiene la
geometría y el especialista tiene las ranuras para llenar. Una tabla no declarada
después del encabezado hace fallar la emisión; dejarla intacta sería publicar los
datos del mes anterior.

#### Verificación

- 137 tests en 16 archivos; `tsc --noEmit` limpio.
- Documento de mayo: la sección 1 queda byte a byte idéntica a la emisión anterior
  (prefijo de 283,485 caracteres comparado); el PDF sigue en 11 páginas.
- En las secciones 2-7 no queda ningún número de mayo: los dos únicos `10` que
  aparecen son parte de las etiquetas ("10 usuarios que más uso hacen...",
  "Las 10 vulnerabilidades...").

#### Lo que queda a revisión del especialista

- La frase de cierre del IDS ("Hasta la fecha no se detectan alertas...") no tiene
  separador, así que se conserva. Afirma un resultado, no una regla: hay que
  revisarla cada mes.
- La firma conserva nombres y cargos. Son estables, pero es una decisión, no una
  consecuencia de la regla.
- La tabla de virus queda con diez renglones vacíos (sus viñetas se ven) y "Nota:"
  queda solo, sin el texto de las fotocopiadoras.

### L22 — El documento se fecha y declara el mes (verbatim)

#### La decisión

La plantilla trae el mes en tres lugares: la fecha ("Matanzas, 9 de Mayo de 2026"),
la línea "Informe mensual correspondiente al mes mayo de 2026" y la prosa de la
sección 1 ("En la evaluación de las trazas del mes de Mayo..."). Se preguntó y la
respuesta fue:

> Fecha y mes automáticos

#### La regla

- Fecha: día de generación en `America/Havana`. Un `new Date()` en UTC a las 22:00
  de La Habana ya es el día siguiente, y el documento saldría fechado un día
  después.
- La fecha usa el mes de emisión, no el del período: un informe de mayo puede
  firmarse en junio.
- Línea del informe: mes y año del período, en minúscula como el original.
- Prosa de la sección 1: se reemplaza "mes de <Mes>" por el mes informado.
- Falla si no encuentra la fecha o la línea del informe: emitir el documento con
  el mes de la plantilla es un error que nadie nota hasta que está firmado.

#### Verificación

- 144 tests en 17 archivos; `tsc --noEmit` limpio.
- Documento de mayo con período junio 2026 y emisión 3 de julio 02:00 UTC:
  "Matanzas, 2 de Julio de 2026" (día local), "Informe mensual correspondiente al
  mes junio de 2026" y "En la evaluación de las trazas del mes de Junio...".
  Ninguna mención de mayo en todo el texto; 11 páginas.

#### Dos errores que los tests destaparon

- La fecha usaba el mes del período. Con período junio y emisión en julio salía
  "2 de Junio"; ahora toma el mes de la fecha local.
- El reemplazo en la prosa perdía el prefijo: "del mes de Mayo" quedaba
  "del MayoJunio". El grupo de captura era el nombre del mes, no el prefijo.

#### Extracción

`blocks.ts`: el escaneo de bloques y el reemplazo de texto estaban duplicados
entre el vaciado de las secciones 2-7 y los campos del período; quedaron en un
módulo compartido.

### L23 — Composición del documento

#### Qué se hizo

`buildReportDocument({ template, traces, period, generatedAt })` junta las tres
operaciones en el único orden que importa: emite la sección 1 (puede quitar
drill-downs y correr los índices de las tablas posteriores), vacía las secciones
2-7 y fecha los campos del período. Toma la plantilla y devuelve el `.docx`; las
otras 26 partes quedan intactas.

#### Verificación

- 147 tests en 18 archivos; `tsc --noEmit` limpio.
- Documento de mayo compuesto con las trazas de mayo y período junio 2026: XML
  byte a byte igual al armado paso a paso, 11 páginas, los tres campos correctos y
  ninguna mención de mayo.
- Test de extremo a extremo con un documento sintético de 22 tablas: la sección 1
  recibe los valores, la tabla 18 conserva dos cabeceras y pierde el dato, la 19
  queda vacía y la 22 conserva tres cabeceras.

#### Lo que sigue faltando

- Ingesta (T9): unir `parseSquidLogStream` con `DailyMetricsAccumulator` por día
  para producir los `DailyMetrics` que consume `buildMonthlyReport`. Falta el
  logformat real y la verificación contra la base de datos.
- Dónde se declaran la cobertura y el `Browsing Time` aproximado (S7/S12): el
  modelo los calcula, pero el `.docx` no tiene un lugar definido para ellos.

### L24 — Ingesta por día local y corrección del mapa al quitar ranuras

#### Ingesta

`ingestSquidLog(stream, { period })` recorre el `access.log` sin materializarlo,
enruta cada registro a su acumulador por día local (`America/Havana`) y devuelve
las métricas de los días del período, los días ajenos contados y los contadores
del parser.

No se asume que el archivo sea del día que dice el nombre: el export de mayo trae
el 30/04, y un registro de las 23:30 locales ya es el día siguiente en UTC. Un día
fuera del período se declara, no se suma (S19).

#### Un defecto de composición

Si el mes trae menos de diez sitios internacionales, `emitTracesSection` elimina
las ranuras sobrantes y las tablas posteriores se corren. El mapa del vaciado de
las secciones 2-7 seguía apuntando a 18-22 y fallaba con "tabla no declarada".
Ahora `buildReportDocument` corre el mapa por la misma cantidad de ranuras.

#### Verificación

- 151 tests en 19 archivos; `tsc --noEmit` limpio.
- Fragmento real de 12 líneas: un día local (2024-05-30), 12 hits, 3 usuarios,
  12 sitios, 0 líneas inválidas, 1 `legacy_connect`, ningún día fuera del período.
- Test de composición con nueve drill-downs: la tabla de anclaje USB queda en la
  posición 17 y se vacía igual, y la fecha sigue correcta.

#### Lo que falta

- Hash SHA-256 del archivo e idempotencia al reimportar (S1): necesitan la capa de
  persistencia.
- El orquestador que une varios días con `buildMonthlyReport` y emite el documento:
  las dos puntas ya están (`ingestSquidLog` → `DailyMetrics[]` y
  `buildReportDocument`).
