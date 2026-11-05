# Plantilla de solicitud de cuenta de usuario — ajuste a hoja Letter

Objetivo: mejorar la disposición de la plantilla imprimible de solicitud de cuenta
de usuario en hoja Letter, de modo que todo el formulario quepa en una sola página,
y agregar los campos de inventario de PC y de cuenta/actividad/administrador de
sistema.
Rama: `feat/account-request-letter-template` · Estrategia: `ask-on-risk` · Runner: `pnpm test` (Vitest).

## Specs

- **S1** — La plantilla se renderiza sobre una hoja Letter (215.9 mm × 279.4 mm)
  con márgenes laterales simétricos de 7 mm y verticales de 6 mm. El título, la
  tabla completa y las firmas deben caber en una sola página al imprimir; no se
  acepta que el contenido salte a una segunda hoja. Ancho útil: 201.9 mm.
- **S2** — Justo debajo de la fila con los nombres de las PC autorizadas se
  agregan dos filas de dos celdas (una por PC): la primera con el encabezado
  `No. Inventario` en cada columna y la segunda con el número de inventario
  guardado (`pcAssetTag` / `additionalPcAssetTag`).
- **S3** — Debajo de `Software autorizado` se agrega una fila de tres celdas con
  los encabezados `Cuenta de Usuario:`, `Actividad que realiza:` y
  `Administrador de Sistema`; la tercera celda incluye las casillas `Si` / `No`.
  Debajo va otra fila de tres celdas con los datos correspondientes.
- **S4** — Los datos nuevos se persisten en `AccountRequest`:
  `cuentaUsuario` (texto opcional, máximo 100 caracteres),
  `actividadRealiza` (texto opcional, máximo 500 caracteres) y
  `administradorSistema` (booleano, por defecto `false`). La migración es
  aditiva y no modifica ni borra datos existentes.
- **S5** — El formulario de creación y edición captura los tres campos y los
  repuebla al editar. Las acciones de creación y actualización los validan y
  guardan.
- **S6** — La plantilla imprime `cuentaUsuario` y `actividadRealiza` en la fila
  de datos, y marca la casilla `Si` o `No` según `administradorSistema`.
- **S7** — Ajustes de redacción de la sección PC: `Se autoriza además a
  autenticarse en los siguientes PC (Nombre PC)` (se corrigen `ademas` y
  `autentificarse`).

## Tasks

- [x] T1 — Documento de seguimiento y rama de trabajo. (hecho)
- [x] T2 — Modelo de datos, migración, esquema Zod, acciones, tipos y formulario
  con los tres campos nuevos; test del esquema. Riesgo: ítem 1 (migración).
- [x] T3 — Rediseño de la sección PC/software y ajuste de alturas para una sola
  hoja Letter; ancho útil al 100 %.
- [x] T4 — Verificación: `pnpm test`, `npx tsc --noEmit` y `pnpm lint`.

## Log

- **L1** — Pedido del usuario (verbatim):

  > vamos a trabajar ahora en el modula de gestion de cuentas de usuario, especificamente en mejorar de manera general la plantilla de solicitud de cuenta de usuario, en cuanto a su disposision en la pagina tmano Letter y ajustar mejor sus campos siempre procurando que quepa bien en la hoja y no salte para otra, ademas debes añadir lo siguiente
  > 1.agregar justo debajo de los nombres de las pc autorizadas 2 filas para introducir el numero de inventario de cada pc, 1era fila con encabezado No. Inventario y segunda vacia para intruducirlo.
  > 2.debajo de software autorizado, agragar una fila con 3 celdas (Cuenta de Usuario:, Actividad que realiza:, Administrador de Sistema con 2 checkbox Si No), y otra fila debajo para intrudicir los datos correspondientes

- **L2** — Supuesto (L1 no lo especifica): `Cuenta de Usuario` no reutiliza
  `username`; se restaura la columna `cuentaUsuario`, tal como estaba prevista en
  el esquema y en la migración histórica
  `20260809054319_remove_account_request_cuenta_usuario`. `Actividad que realiza`
  y `Administrador de Sistema` se restauran igual (`actividadRealiza`,
  `administradorSistema`).
- **L3** — Presupuesto vertical calculado para Letter: 792 pt de alto, 34 pt de
  márgenes verticales, 17.8 pt de título y 726.3 pt de tabla = 778.1 pt; quedan
  ~14 pt de holgura. Se comprimen filas con espacio sobrante (APN 14.4→10.5,
  tipo de cuenta 18.9→14.4, horario 16.5→14.4, baja 33.9→25.2) sin tocar las
  firmas.
- **L4** — Verificación observada: `pnpm test` → 290 passed, 9 skipped;
  `npx tsc --noEmit` → sin errores; `pnpm lint` → 0 errores (1 warning
  preexistente en `app/(auth)/actions/signout-action.ts`); `prisma validate` →
  esquema válido. La migración `20261102120000_add_account_request_user_account_fields`
  fue aplicada a la base configurada con `prisma migrate deploy` y verificada:
  `cuentaUsuario` (text, nullable), `actividadRealiza` (text, nullable) y
  `administradorSistema` (boolean, not null, default false);
  `prisma migrate status` → `Database schema is up to date!`.
- **L5** — La revisión nativa de RDD quedó bloqueada en la validación dirigida:
  `review-validator` devolvió `validator_result_not_admissible` dos veces, así
  que no se emitió recibo. La corrección aplicada fue una línea explícita
  `administradorSistema` en el update (el `...data` ya lo persistía).
- **L6** — Ajustes pedidos tras revisar la solicitud de prueba: las casillas se
  dibujan como cuadrados de 7.2 pt con `X` cuando están marcadas (antes eran
  `[X]` / `[  ]`); la fecha de expiración ya no lleva guiones bajos además del
  borde (un solo subrayado); y los nombres de PC e inventario ya no llevan
  subrayado interno además del borde de fila.
- **L7** — Corrección de L6: se restauró el placeholder de la fecha de
  expiración (`____/______/202___`) y se quitó su borde inferior, de modo que
  no quede doble subrayado. Cuando hay fecha, se imprime como texto sin línea.
- **L8** — Ajustes de la revisión visual completa: se quitó `labelsH={17.8}` de
  la cuarta firma (la fila de etiquetas es de una línea), lo que devuelve la
  hoja a 1056.0 px frente a 1056.2 px de Letter, con 6.35 mm de margen inferior;
  `actividadRealiza` y `cuentaUsuario` viven en una fila de 19 pt con
  `line-clamp-2 break-words` (el máximo de 500 se mantiene en el formulario y la
  impresión trunca a dos líneas); la fila Temporal y el bloque No laborables
  quedan centrados verticalmente; Tipo de personal y APN se distribuyen con
  `justify-between`; y TIPO DE GESTIÓN usa tres columnas iguales de 24.9%.
  Verificación: `npx tsc --noEmit` limpio, `pnpm test` → 290 passed / 9 skipped,
  `pnpm lint` → 0 errores (1 warning preexistente), render headless a 216 mm con
  hoja de 1056.0 px y contenido de 1010.3 px.
