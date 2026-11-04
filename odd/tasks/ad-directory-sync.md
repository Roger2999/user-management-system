# Directorio de cuentas: sincronización desde Active Directory

Objetivo: llenar `ProxyAccount` (displayName, position, area, active) con los
usuarios del dominio vía LDAPS, para que los nombres y cargos del informe
mensual existan sin depender de `AccountRequest` en un despliegue nuevo.
Rama: `feat/ad-directory-sync` · Estrategia: work-unit commits · Runner: `pnpm test` (Vitest).

## Specs

- **S1** — El sistema sincroniza los usuarios del dominio desde el AD Domain
  Controller (Windows Server 2022) por **LDPS/LDAPS**: búsqueda paginada sobre
  la OU de usuarios con la cuenta de servicio. (Nota: el usuario escribió
  "LDPS" en el log; se implementó LDAPS.)
- **S2** — Configuración solo por variables de entorno, mismo patrón que hoy
  (`-e` en el LXC): `AD_URL` (`ldaps://host:636`), `AD_BIND_DN`,
  `AD_BIND_PASSWORD`, `AD_USER_SEARCH_BASE`. Sin AD configurado, el botón de
  sincronización se muestra deshabilitado con el motivo; no se lanza error al
  abrir la pantalla.
- **S3** — Mapeo por usuario: `sAMAccountName` → `username`;
  `displayName` (si falta, `givenName + sn`) → `displayName`; `title` →
  `position`; `department` → `area`; cuenta deshabilitada
  (`userAccountControl` bit 0x2) → `active=false`. Filtro LDAP por defecto
  `(&(objectCategory=person)(objectClass=user))` — **supuesto**: excluye
  cuentas de máquina y de servicio; los usuarios de trazo no navegables
  aparecen con su `displayName` igual que cualquier otro.
- **S4** — El sync es **upsert idempotente**: AD es autoritativo para
  `displayName`, `position`, `area` y `active`; re-corre no duplica ni borra.
  `ProxyAccount` sigue siendo la clave `username`; los hallazgos identifican
  con `proxyAccountId` existente sin cambiar (`rows.ts S9` intacto).
- **S5** — Disparo manual: botón `Sincronizar desde AD` en
  `/dashboard/settings`, solo ADMIN (`requireAdmin`), devuelve resumen
  (creadas / actualizadas / deshabilitadas). Sin job programado en esta
  entrega: queda como mejora futura (ver `## Log` L5 el alcance cerrado).
- **S6** — La generación del informe no cambia: `loadProfiles`
  (`generate.ts:39-79`) mantiene precedencia `AccountRequest` → `ProxyAccount`.
  Con el directorio lleno, el fallback cubre las tablas 7, 8 y la 4.
- **S7** — Seguridad: LDAPS obligatorio (se rechaza `ldap://` explícito),
  validación TLS por defecto estricta; `AD_TLS_INSECURE=true` permite
  certificados autofirmados del DC como escape documentado. Credenciales fuera
  de la base y fuera de git (`.env` / `-e`).
- **S8** — Verificación: cliente LDAP y cliente Prisma separados por una
  frontera (mapper puro + repositorio configurable); tests unitarios de
  mapeo de atributos, upsert (crear/actualizar/deshabilitar) y guardas de
  configuración con fake. Más la suite, `tsc` y `eslint` en verde.
- **S9** — Documentación: `.env.example` con las variables y comentario; 
  `DEPLOYMENT_GUIDE.md` con el paso de pasarlas a producción; `README.md`
  menciona el directorio sincronizado desde AD. Incluye crear la cuenta de
  servicio de solo lectura en el DC.

## Tasks

- **T1** — Documento de seguimiento y espejo en Engram. Route: inline. Status: hecho.
- **T2** — Dependencia `ldapts` + módulo de configuración env con guardas. Route: inline. Spec: S2, S7. Status: hecho (`265260e`; 20 tests de lib/ad en verde).
- **T3** — Cliente LDAP + mapper + sync upsert (con frontera para tests). Route: inline. Spec: S1, S3, S4, S8. Status: hecho (`265260e`; mapper/upsert con fake, cliente real fuera de toda prueba).
- **T4** — Server action + sección admin en settings con resumen. Route: inline. Spec: S5. Status: hecho (`59e669e`);iagnostics:==='SER sync card'== pendiente pruebas de UI manual.
- **T5** — Tests de mapping/upsert/guardas + suite completa. Route: inline. Spec: S8. Status: pendiente.
- **T6** — Docs `.env.example` + guía despliegue + README. Route: inline. Spec: S9. Status: hecho (`4a08e83`).

## Log

### L1 — Pedido original (verbatim)

> en mi empresa administro un server windows 2022 como addc donde tengo todos los usuarios del dominio, recuerda que los usuarios se autentican al proxy contra esos usuario de dominio, que opinas?

### L2 — Alcance del sync, decisión (verbatim del usuario tras propuesta)

> tendria algun beneficio importa todo el dominio?

Seguido del usuario cerró con:

> si perfecto

Decisión: sincronizar el **dominio completo** (la OU de usuarios), no solo
cuentas con tráfico: cualquier usuario que aparezca en el log del mes ya nace
identificado. Razonamiento compartido: flujo mes-nuevo vs. sync retrasado.
Filtro por defecto excluye cuentas de máquina/servicio (S3, supuesto).

### L3 — Contexto del problema (registro)

El despliegue es nuevo: no hay `AccountRequest` históricas y
`ProxyAccount.displayName/position` nunca se llenan, así que las tablas 7/8/4
del informe salen sin nombres. `loadProfiles` (precedente S6) ya contempla el
fallback a `ProxyAccount`; el feature llena ese fallback con datos reales.

### L4 — Ruta

Unidad única de comportamiento (config → cliente → upsert → acción + UI →
docs): **inline** para todos los tasks. No hubo razón del Writer trigger
(serial, no paralelo; sin backstop de contexto).

### L5 — Mejoras futuras fuera de alcance

- Job programado (cron mensual/semanal del sync). Decision compartida: MVP con
  trigger manual en esta entrega.
- Edición manual de cuentas en UI desde el directorio (para correcciones que
  AD no resuelve). No pedida explícitamente; queda para después.

### L6 — Unidad única: implementación completa

- `265260e` lib/ad (config, mapper, sync), `59e669e` action + card,
  `4a08e83` documentación, `11472aa` documento + lockfile.
- Verificación observada: `pnpm test` → 279 passed / 9 saltados (todos los
  archivos en verde); `tsc --noEmit` limpio; `eslint .` deja solo 2 warnings
  preexistentes del patrón `_prevState` (la convención vigente del repo).
- Pendiente: el piloto contra un DC real (no hay AD en este entorno) —
  crear la cuenta de servicio en el dominio, correr el sync desde settings
  y regenerar el informe de octubre para ver los nombres llenos (T7).
