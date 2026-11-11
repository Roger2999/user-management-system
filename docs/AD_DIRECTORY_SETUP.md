# Guía de despliegue — Directorio de cuentas (Active Directory)

Pasos exactos para que la sincronización de cuentas de proxy funcione en
producción. Se asume un despliegue siguiendo `docs/DEPLOYMENT_GUIDE.md`; esta guía
cubre solo lo nuevo del módulo de AD.

## 1. Cuenta de servicio en el DC (Windows Server 2022)

1. **AD Users and Computers → navegá hasta la OU de los usuarios del dominio**
   → clic derecho → *New → User*.
2. Rellena:
   - First name: `svc-ums-sync`
   - User logon name: `svc-ums-sync`
   - Password: elige una con los requisitos del dominio y marca
     **Password never expires** y **User cannot change password**.
3. En la misma ventana deja sin marcar cualquier otra opción y finaliza. Esta
   cuenta no debe iniciar sesión en ningún equipo ni tener grupo de
   administración.

## 2. Delegar solo lectura sobre la OU

4. Clic derecho sobre la **OU que contiene a los usuarios** →
   *Delegate Control…* → *Next*.
5. *Add…* → escribe `svc-ums-sync` → *Check Names* → *Next*.
6. En *Tasks to Delegate* selecciona **Read all user information** → *Next →
   Finish*.

## 3. TLS del puerto 636 (LDAPS)

7. Si el dominio tiene CA interna: en el DC debe existir el certificado
   `Server Authentication` con el FQDN del DC. Es el escenario en el que el
   `AD_TLS_INSECURE` queda vacío y no hay nada más que hacer.
8. Si el DC solo tiene certificado **autofirmado**:
   - Prefiere instalar ese certificado en el contenedor (a pasos más abajo).
   - O marca el escape documentado `AD_TLS_INSECURE="true"` en el `.env`.
9. Abre el puerto desde el contenedor de la app:

   ```bash
   nc -zv <DC_TU-DOMINIO> 636
   ```

   Si da `Connection refused`, es firewall del DC o del switch del Vlan.

## 4. Variables de entorno de producción

10. Edita `/opt/user-management-system/.env` y agrega (bloque ya listo para
    copiar en la sección 7.3 de `docs/DEPLOYMENT_GUIDE.md`):

```env
AD_URL="ldaps://<DC_TU-DOMINIO>:636"
AD_BIND_DN="CN=svc-ums-sync,OU=<TU-OU>,DC=<TU>,DC=<DOMINIO>"
AD_BIND_PASSWORD="<CONTRASEÑA>"
AD_USER_SEARCH_BASE="OU=<OU-DE-USUARIOS>,DC=<TU>,DC=<DOMINIO>"
AD_TLS_INSECURE=""
```

11. Nunca uses `ldap://` (sin s): el bind cruza la red con credenciales y el
    sistema lo rechaza explícitamente (solo acepta `ldaps://`).
12. Con el archivo listo, reafirma permisos:

```bash
chown ums:ums /opt/user-management-system/.env
chmod 600 /opt/user-management-system/.env
```

> `AD_TLS_INSECURE="true"` solo si el certificado del DC es autofirmado y
> quedó sin CA interna. Deja vacío en cualquier otro caso.

## 5. Instalar y reinciar

13. En `/opt/user-management-system`:

```bash
sudo -u ums pnpm install
sudo -u ums bash -lc 'set -a; . ./.env; set +a; pnpm exec prisma migrate deploy'
sudo -u ums bash -lc 'set -a; . ./.env; set +a; pnpm build'
```

14. Reinicia el servicio:

```bash
systemctl restart ums-app
```

> Este feature **no agrega migraciones**: `migrate deploy` se corre para
> confirmar que la base quedó en el estado esperado, no por cambios de schema.

## 6. Verificación de la sincronización

15. Entra a la app como usuario ADMIN → **Configuración → Administración**.
16. Baja a la tarjeta **Directorio de cuentas**:
    - Si algún `AD_*` falta, verás el motivo y el botón deshabilitado: eso es
      que el `.env` que le llegó al proceso no traía esa variable. Revisa el
      paso 10 y cómo carga el `.env` el systemd.
    - Si las variables llegaron, hace click en **Sincronizar desde AD**.
17. Resultado esperado: `Directorio sincronizado… X creada(s), Y
    actualizada(s), Z deshabilitada(s)`. Con un dominio lleno, la primera
    corrida crea tantas cuentas como usuarios humanos haya en la OU.
18. Confirma los datos con una consulta puntual:

```bash
sudo -u ums psql "$DATABASE_URL" -c \
 "select username, display_name, position, area, active from proxy_account order by username limit 10;"
```

## 7. Ciclo mensual (igual todos los meses)

19. **Sincronizar primero**: desde Configuración → Administración →
    Directorio de cuentas → *Sincronizar desde AD*.
20. Después importar los logs de Squid del mes y generar el informe.
21. El orden importa: el nombre y el cargo se leyen en el momento de generar.
    Si el informe se generó antes del sync, regenerarlo (el `.docx` queda
    emitido con lo que ya se capturó; la regeneración relee el directorio).

## 8. Diagnóstico rápido

| Síntoma | Causa más probable |
| --- | --- |
| «No se pudo sincronizar…» | el contenedor no alcanza `DC:636` o falla el TLS (pasos 7–9) |
| Falla de credenciales en el mensaje | contraseña o DN mal escritas (pasos 1, 10) |
| Creó cuentas, pero con nombre vacío | esos usuarios del AD no tienen `displayName` ni `givenName`+`sn` (completar en el AD; se corrige con otro sync) |
| Botón deshabilitado en Configuración → Administración | alguna `AD_*` no llegó al entorno del servidor (pasos 10, 16) |
| Certificado rechazado | certificado autofirmado sin CA (paso 8) |
