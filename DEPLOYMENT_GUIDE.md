# Despliegue en Proxmox (LXC) con TLS interno

Producción en LAN sobre un contenedor LXC: PostgreSQL local, la app Next.js bajo systemd, una CA interna (step-ca) para emitir el certificado y Nginx como terminador TLS. El desarrollo local y la descripción de los módulos están en [`README.md`](README.md).

**Dominio:** `ums.elecmtz.une.cu`, con resolución solo interna. Si cambia, hay que actualizarlo en el `.env`, `trustedOrigins`, el SAN del certificado, Nginx y el DNS.

## Arquitectura

```text
Proxmox VE
└── LXC 100 (Ubuntu 24.04, 2 vCPU / 4 GB / 30 GB)
    ├── PostgreSQL 16            127.0.0.1:5432
    ├── ums-app (systemd)        127.0.0.1:3000
    ├── step-ca (systemd)        127.0.0.1:8443
    ├── ums-cert-renew (systemd)
    └── Nginx                    443 TLS → 3000

DNS interno: ums.elecmtz.une.cu → IP del LXC
Clientes:    confían en el root de la CA interna (GPO)
```

HTTPS es obligatorio en producción: con `BETTER_AUTH_URL` en `https://`, la app marca las cookies como `Secure`, activa HSTS y agrega `upgrade-insecure-requests` al CSP. Better Auth además rechaza orígenes no declarados en `trustedOrigins`. Una CA interna evita depender del DNS público: la zona la administra el nivel nacional y no se toca.

## 1. Requisitos previos

| Requisito                     | Detalle                                                |
| ----------------------------- | ------------------------------------------------------ |
| Servidor Proxmox              | Acceso root o usuario con permisos sobre el nodo       |
| Plantilla Ubuntu 24.04        | Disponible vía `pveam`                                 |
| IP estática libre en la LAN   | Ejemplo: `192.168.1.100/24`                            |
| DNS interno                   | Registro `ums.elecmtz.une.cu` → IP del LXC (sección 8) |
| GPO o admin local en clientes | Para confiar el root de la CA (sección 9)              |

La instalación necesita salida a internet: `registry.npmjs.org` para las dependencias, `fonts.googleapis.com` durante el build y `dl.smallstep.com` para los binarios de step.

## 2. Crear el contenedor

Ejecutar en el **shell del nodo Proxmox**.

```bash
pveam update
pveam available --section system | grep ubuntu-24.04
pveam download local ubuntu-24.04-standard_24.04-2_amd64.tar.zst
```

Ajustar storage (`pvesm status`), IP, gateway y DNS interno:

```bash
pct create 100 local:vztmpl/ubuntu-24.04-standard_24.04-2_amd64.tar.zst \
  --hostname ums-app \
  --cores 2 \
  --memory 4096 \
  --swap 1024 \
  --rootfs local-lvm:30 \
  --net0 name=eth0,bridge=vmbr0,ip=192.168.1.100/24,gw=192.168.1.1,firewall=1 \
  --unprivileged 1 \
  --features nesting=0 \
  --ostype ubuntu \
  --nameserver 192.168.1.10 \
  --start 1

pct enter 100
```

> `--nameserver` debe ser el DNS interno de la empresa: el dominio solo resuelve adentro. Por WebUI se usan los mismos valores en `Create CT`.

Dentro del contenedor se trabaja como `root`; si se entra por SSH con otro usuario, anteponer `sudo`.

## 3. Base del contenedor

```bash
apt update && apt upgrade -y
apt install -y curl git ca-certificates gnupg build-essential
timedatectl set-timezone America/Havana   # ajustar si aplica
```

```bash
# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# pnpm 12: pnpm-workspace.yaml usa allowBuilds, permissions y verifyDepsBeforeRun
npm install -g pnpm@12
node --version && pnpm --version
```

```bash
# PostgreSQL 16 (solo localhost)
apt install -y postgresql postgresql-contrib
systemctl enable --now postgresql
```

Crear usuario y base (generar la contraseña con `openssl rand -base64 24`):

```bash
sudo -u postgres psql
```

```sql
CREATE USER user_management WITH PASSWORD '<CONTRASEÑA_FUERTE>';
CREATE DATABASE user_management OWNER user_management;
\c user_management
CREATE EXTENSION IF NOT EXISTS citext;
\q
```

Verificar por TCP, igual que lo hará la app:

```bash
psql "postgresql://user_management:<CONTRASEÑA_FUERTE>@127.0.0.1:5432/user_management" -c "SELECT 1;"
```

> No hace falta tocar `pg_hba.conf`: Ubuntu ya habilita `scram-sha-256` para `127.0.0.1/32`. No exponer PostgreSQL a la red.

## 4. Aplicación

### 4.1 Usuario y código

```bash
useradd --system --home /opt/user-management-system --shell /usr/sbin/nologin ums
mkdir -p /opt/user-management-system
git clone https://github.com/Roger2999/user-management-system.git /opt/user-management-system
chown -R ums:ums /opt/user-management-system
```

### 4.2 `.env` de producción

Crear `/opt/user-management-system/.env`:

```env
DATABASE_URL="postgresql://user_management:<CONTRASEÑA_FUERTE>@127.0.0.1:5432/user_management"

# Generar con: openssl rand -base64 32
BETTER_AUTH_SECRET=<SECRETO_ALEATORIO>
BETTER_AUTH_URL=https://ums.elecmtz.une.cu
NEXT_PUBLIC_BETTER_AUTH_URL=https://ums.elecmtz.une.cu

# Recomendada. Sin clave válida, la recuperación de contraseña falla y queda
# en el log; el resto de la app sigue funcionando. El remitente actual
# (onboarding@resend.dev) es de prueba: producción necesita un dominio
# verificado en Resend.
RESEND_API_KEY=re_xxxxxxxxxxxxx

# ====== DIRECTORIO DE CUENTAS (ACTIVE DIRECTORY) ======
# Recomendadas a partir del despliegue: llenan nombre, cargo y área de las
# cuentas de proxy que usa el informe mensual. Sin ellas el botón
# «Sincronizar desde AD» queda deshabilitado y el resto de la app funciona.
# LDAPS obligatorio (nunca `ldap://`): el bind cruza la red con credenciales
# de dominio. La cuenta de servicio sólo necesita permiso de lectura sobre
# la OU indicada; administrador del dominio no hace falta.
AD_URL="ldaps://<DC_TU-DOMINIO>:636"
AD_BIND_DN="CN=svc-ums-sync,OU=Servicios,DC=tu,DC=dominio"
AD_BIND_PASSWORD="<CONTRASEÑA_DE_SERVICIO>"
AD_USER_SEARCH_BASE="OU=Usuarios,DC=tu,DC=dominio"
AD_TLS_INSECURE=""

# Opcionales: por defecto la plantilla se busca en
# storage/templates/monthly-report.docx y los emitidos van a storage/reports.
# REPORTS_TEMPLATE_PATH=
# REPORTS_STORAGE_DIR=
```

```bash
chown ums:ums /opt/user-management-system/.env
chmod 600 /opt/user-management-system/.env
```

> No definir `NODE_ENV` en `.env`: `next build` y `next start` lo fijan. Definirlo afecta además a `pnpm install` (podría omitir las devDependencies que el build necesita).

> **Directorio de cuentas (AD):** las variables `AD_*` llenan el nombre y el
> cargo de la cuenta de proxy en el informe mensual. En el DC se crea una
> única cuenta de servicio (`svc-ums-sync`) con permiso de **lectura** sobre
> la OU de usuarios, y en la app se dispara la sincronización desde
> **Configuración > Directorio de cuentas > Sincronizar desde AD** (solo
> administrador). Si el DC usa certificados autofirmados sin CA interna,
> defíní `AD_TLS_INSECURE="true"`; en un dominio con CA funcional dejalo
> vacío. Sin AD configurado, el botón queda deshabilitado y el resto de la
> app funciona igual.
>

### 4.3 Dependencias y migraciones

```bash
cd /opt/user-management-system
sudo -u ums pnpm install
sudo -u ums pnpm exec prisma migrate deploy
sudo -u ums pnpm db:seed        # admin / admin, solo si la tabla user está vacía
sudo -u ums pnpm db:seed:rules  # idempotente; sin reglas los informes no detectan hallazgos
```

Todos los comandos leen `.env` desde el directorio de la app; no hace falta `set -a; . ./.env`. `postinstall` regenera el cliente Prisma y no necesita base de datos.

### 4.4 Plantilla de informes

El `.docx` oficial no se versiona (`.gitignore` excluye `storage/`), así que hay que copiarlo:

```bash
install -d -o ums -g ums -m 750 /opt/user-management-system/storage/templates
scp monthly-report.docx root@ums.elecmtz.une.cu:/opt/user-management-system/storage/templates/
chown ums:ums /opt/user-management-system/storage/templates/monthly-report.docx
chmod 640 /opt/user-management-system/storage/templates/monthly-report.docx
chmod 750 /opt/user-management-system/storage
```

Sin ese archivo, generar un informe responde `No se encontró la plantilla oficial. Configura REPORTS_TEMPLATE_PATH.`

- La plantilla v2 es la del documento oficial **"Informe Mensual de Ciberseguridad"**; la anterior quedó archivada como `monthly-report-v1.docx` en la máquina de trabajo.
- `TEMPLATE_VERSION` en `lib/reports/storage.ts` va a la par: v2 desde el presente release.
- No se requiere reinicio del servicio: la plantilla se lee en cada generación.

### 4.5 Origen permitido

Verificar que `lib/auth.ts` incluya el origen de producción:

```bash
grep -n -A6 "trustedOrigins" lib/auth.ts
```

Debe aparecer `https://ums.elecmtz.une.cu`. No agregar la variante `http://`: en producción se accede solo por HTTPS. Si se modificó el archivo, hacer commit antes del build.

### 4.6 Build

```bash
sudo -u ums pnpm build
```

`NEXT_PUBLIC_*` se incrusta en el bundle: todo cambio en esas variables o en `trustedOrigins` exige rebuild. El build descarga las fuentes Geist (`next/font/google`); en runtime no hay dependencia externa.

## 5. Servicio systemd de la aplicación

`/etc/systemd/system/ums-app.service`:

```ini
[Unit]
Description=User Management System (Next.js 16)
After=network-online.target postgresql.service
Wants=network-online.target postgresql.service

[Service]
Type=simple
User=ums
Group=ums
WorkingDirectory=/opt/user-management-system
EnvironmentFile=/opt/user-management-system/.env
ExecStart=/opt/user-management-system/node_modules/.bin/next start -H 127.0.0.1 -p 3000
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now ums-app
systemctl status ums-app
curl -s http://127.0.0.1:3000 | head -c 200
```

## 6. CA interna y certificado TLS

La CA vive en el mismo LXC y solo escucha en `127.0.0.1:8443`.

### 6.1 Instalar step

```bash
cd /tmp
curl -LO https://dl.smallstep.com/gh-release/cli/docs-ca-install/step-cli_amd64.tar.gz
tar -xzf step-cli_amd64.tar.gz && cp step-cli_amd64/bin/step /usr/local/bin/

curl -LO https://dl.smallstep.com/gh-release/ca/docs-ca-install/step-ca_amd64.tar.gz
tar -xzf step-ca_amd64.tar.gz && cp step-ca_amd64/bin/step-ca /usr/local/bin/

step version && step-ca version
```

> Si las URLs cambian, consultar <https://smallstep.com/docs/step-ca/installation/>.

### 6.2 Usuario y secretos

```bash
useradd --system --home /etc/step-ca --shell /usr/sbin/nologin step
install -d -o step -g step -m 0750 /etc/step-ca /etc/step-ca/secrets

openssl rand -base64 24 > /etc/step-ca/secrets/ca-password
openssl rand -base64 24 > /etc/step-ca/secrets/provisioner-password
chown step:step /etc/step-ca/secrets/ca-password /etc/step-ca/secrets/provisioner-password
chmod 600 /etc/step-ca/secrets/ca-password /etc/step-ca/secrets/provisioner-password
```

### 6.3 Inicializar la CA

```bash
sudo -u step STEPPATH=/etc/step-ca step ca init \
  --name "UMS CA Interna" \
  --dns ums.elecmtz.une.cu \
  --dns localhost \
  --address 127.0.0.1:8443 \
  --provisioner admin \
  --password-file /etc/step-ca/secrets/ca-password \
  --provisioner-password-file /etc/step-ca/secrets/provisioner-password \
  --with-ca-url https://127.0.0.1:8443
```

Genera `config/ca.json`, `certs/root_ca.crt`, `secrets/` (claves privadas) y `db/`.

`/etc/systemd/system/step-ca.service`:

```ini
[Unit]
Description=step-ca (CA interna UMS)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=step
Group=step
Environment=STEPPATH=/etc/step-ca
ExecStart=/usr/local/bin/step-ca /etc/step-ca/config/ca.json
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now step-ca
systemctl status step-ca
journalctl -u step-ca -n 20 --no-pager
```

### 6.4 Emitir el certificado y armar la cadena

```bash
install -d -o root -g ssl-cert -m 0750 /etc/ssl/private/step
usermod -aG ssl-cert www-data

STEPPATH=/etc/step-ca step ca certificate \
  --provisioner admin \
  --provisioner-password-file /etc/step-ca/secrets/provisioner-password \
  --not-after 8760h \
  ums.elecmtz.une.cu \
  /etc/ssl/private/step/elecmtz.crt \
  /etc/ssl/private/step/elecmtz.key

cp /etc/step-ca/certs/root_ca.crt /etc/ssl/private/step/root_ca.crt
cat /etc/step-ca/certs/root_ca.crt >> /etc/ssl/private/step/elecmtz.crt

chown root:ssl-cert /etc/ssl/private/step/elecmtz.key
chmod 640 /etc/ssl/private/step/elecmtz.key
chmod 644 /etc/ssl/private/step/elecmtz.crt /etc/ssl/private/step/root_ca.crt
```

`--not-after 8760h` equivale a un año. Verificar SAN, emisor y vencimiento:

```bash
step certificate inspect /etc/ssl/private/step/elecmtz.crt | head -25
```

### 6.5 Renovación automática

`step ca renew --daemon` se autentica contra la CA con mTLS y recarga Nginx al renovar. `/etc/systemd/system/ums-cert-renew.service`:

```ini
[Unit]
Description=Renovacion automatica del certificado TLS de UMS
After=step-ca.service nginx.service
Wants=step-ca.service

[Service]
Type=simple
Environment=STEPPATH=/etc/step-ca
ExecStart=/usr/local/bin/step ca renew --daemon --exec "/usr/bin/systemctl reload nginx" /etc/ssl/private/step/elecmtz.crt /etc/ssl/private/step/elecmtz.key
Restart=on-failure
RestartSec=30

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now ums-cert-renew
systemctl status ums-cert-renew
```

Renueva cuando falta un tercio de la vida del certificado (~mes 8 con uno de un año). Si la CA está caída, reintenta mientras Nginx sigue sirviendo el certificado vigente.

## 7. Nginx

```bash
apt install -y nginx
```

`/etc/nginx/sites-available/user-management`:

```nginx
server {
    listen 80;
    server_name ums.elecmtz.une.cu;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ums.elecmtz.une.cu;

    ssl_certificate     /etc/ssl/private/step/elecmtz.crt;
    ssl_certificate_key /etc/ssl/private/step/elecmtz.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    # Los access.log de Squid rondan los 90 MB por día.
    client_max_body_size 512M;
    proxy_request_buffering off;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/user-management /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx
```

Prueba local dentro del LXC:

```bash
STEPPATH=/etc/step-ca step certificate install /etc/step-ca/certs/root_ca.crt
curl -sS https://ums.elecmtz.une.cu | head -c 200
```

## 8. DNS interno

En el servidor DNS de la empresa:

```text
ums.elecmtz.une.cu.    IN    A    <IP_DEL_LXC>
```

Verificar desde una PC de la red con `nslookup ums.elecmtz.une.cu`.

## 9. Confiar el root de la CA en los clientes

Distribuir `/etc/ssl/private/step/root_ca.crt`. Sin ese paso el navegador muestra «no se pudo verificar el certificado»; no es un problema del certificado emitido.

**Windows por GPO:**

1. Copiar `root_ca.crt` a un recurso de red accesible.
2. `gpmc.msc` → GPO sobre el OU de las PC.
3. `Computer Configuration → Policies → Windows Settings → Security Settings → Public Key Policies → Trusted Root Certification Authorities`.
4. Importar `root_ca.crt` en «Entidades de certificación raíz de confianza».
5. `gpupdate /force` en cada PC y verificar con `certlm.msc`.

**Manual:**

```powershell
# Windows (consola administrativa)
step certificate install root_ca.crt
```

```bash
# Linux
sudo cp root_ca.crt /usr/local/share/ca-certificates/ums-root.crt
sudo update-ca-certificates
```

En macOS: doble clic en `root_ca.crt` → Llavero del sistema → «Confiar siempre».

## 10. Verificación final

Desde una PC de la red con el root confiado:

| #   | Paso      | Acción                                                             | Esperado                                                  |
| --- | --------- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| 1   | DNS       | `nslookup ums.elecmtz.une.cu`                                      | IP del LXC                                                |
| 2   | TLS       | `curl -v https://ums.elecmtz.une.cu`                               | Handshake correcto, cadena leaf → root                    |
| 3   | App       | Abrir `https://ums.elecmtz.une.cu`                                 | Login sin advertencias                                    |
| 4   | Sesión    | Iniciar sesión y recargar                                          | Se mantiene en `/dashboard`                               |
| 5   | Cookie    | DevTools → Application → Cookies                                   | `better-auth.session_token` con `Secure` y `SameSite=Lax` |
| 6   | HTTP      | Abrir `http://ums.elecmtz.une.cu`                                  | Redirige a `https://`                                     |
| 7   | Servicios | `systemctl status ums-app step-ca ums-cert-renew nginx postgresql` | Todos `active (running)`                                  |

Primer acceso: el administrador inicial ya se creó en 4.3. Cambiar su contraseña desde Configuración.

## 11. Backups

**Base de datos.** `/usr/local/sbin/backup-ums-db.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
BACKUP_DIR="/var/backups/user-management"
export PGPASSWORD='<CONTRASEÑA_FUERTE>'
mkdir -p "$BACKUP_DIR"
pg_dump -h 127.0.0.1 -U user_management user_management \
  | gzip > "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz"
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete
```

```bash
chmod +x /usr/local/sbin/backup-ums-db.sh
crontab -e
# 0 2 * * * /usr/local/sbin/backup-ums-db.sh >/dev/null 2>&1
```

Restaurar:

```bash
gunzip -c /var/backups/user-management/backup_YYYYMMDD_HHMMSS.sql.gz \
  | psql "postgresql://user_management:<CONTRASEÑA_FUERTE>@127.0.0.1:5432/user_management"
```

**Fuera del LXC** deben guardarse, además del backup del contenedor:

- `/etc/step-ca/` completo y `/etc/ssl/private/step/`. Si se pierden las claves de la CA, todos los certificados emitidos dejan de ser confiables.
- `/opt/user-management-system/storage/`: la plantilla oficial (no está en git) y los `.docx` emitidos, que contienen datos de navegación de personas.
- `/opt/user-management-system/.env`: contiene el secreto de sesiones y la contraseña de la base.

**Contenedor completo.** En Proxmox: `Datacenter → <nodo> → Backup → Add`, diario a las 02:00, compresión ZSTD y modo Snapshot, incluyendo el CT 100.

## 12. Actualización

`/usr/local/sbin/update-ums.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /opt/user-management-system

sudo -u ums git pull --ff-only
sudo -u ums pnpm install
sudo -u ums pnpm exec prisma migrate deploy
sudo -u ums pnpm db:seed:rules
sudo -u ums pnpm build
systemctl restart ums-app
echo "OK: ums-app actualizado"
```

```bash
chmod +x /usr/local/sbin/update-ums.sh
sudo /usr/local/sbin/update-ums.sh
```

Un cambio en `trustedOrigins` o en cualquier `NEXT_PUBLIC_*` exige rebuild; el script lo hace siempre. `db:seed:rules` es idempotente y solo agrega o reactiva patrones.

## 13. Problemas comunes

| Síntoma                               | Causa probable                                             | Solución                                                                               |
| ------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| El login no persiste                  | Acceso por HTTP o IP, u origen ausente en `trustedOrigins` | Usar `https://ums.elecmtz.une.cu`, verificar 4.5 y rebuild                             |
| «No se pudo verificar el certificado» | Root de la CA no instalado en el equipo                    | Sección 9                                                                              |
| `502 Bad Gateway`                     | App caída                                                  | `systemctl status ums-app`; `journalctl -u ums-app -n 50`; revisar `.env`              |
| `Connection refused` a la base        | PostgreSQL caído o `DATABASE_URL` incorrecta               | `systemctl status postgresql`; probar con `psql` (sección 3)                           |
| El certificado no se renueva          | `step-ca` o `ums-cert-renew` caídos                        | `systemctl status step-ca ums-cert-renew`; `journalctl -u ums-cert-renew -n 50`        |
| `413` al importar un log              | `client_max_body_size` insuficiente en Nginx               | Sección 7 (512M) y recargar Nginx                                                      |
| `504` al importar o generar           | Timeouts del proxy cortos                                  | Sección 7 (`proxy_*_timeout 300s`)                                                     |
| `citext` no existe                    | Extensión no creada                                        | `sudo -u postgres psql -d user_management -c "CREATE EXTENSION IF NOT EXISTS citext;"` |
| Los informes no detectan hallazgos    | Tabla `category_rule` vacía                                | `sudo -u ums pnpm db:seed:rules`                                                       |
| «No se encontró la plantilla oficial» | Falta el `.docx` o `REPORTS_TEMPLATE_PATH` apunta mal      | Sección 4.4                                                                            |
| No llegan los emails de recuperación  | Sin clave válida o dominio no verificado en Resend         | Configurar `RESEND_API_KEY` y verificar el dominio; revisar el log de `ums-app`        |
| Cambié una URL y no se aplica         | `NEXT_PUBLIC_*` se incrusta en el build                    | Rebuild y reinicio (sección 12)                                                        |

## 14. Archivos y servicios

| Elemento        | Ruta / servicio                                      |
| --------------- | ---------------------------------------------------- |
| Código          | `/opt/user-management-system` (usuario `ums`)        |
| Entorno         | `/opt/user-management-system/.env` (modo 600)        |
| Informes        | `/opt/user-management-system/storage/`               |
| App             | `ums-app.service` → `127.0.0.1:3000`                 |
| CA interna      | `/etc/step-ca` (usuario `step`), `step-ca.service`   |
| Certificado TLS | `/etc/ssl/private/step/elecmtz.crt` + `.key`         |
| Root de la CA   | `/etc/ssl/private/step/root_ca.crt`                  |
| Renovación      | `ums-cert-renew.service`                             |
| Proxy / TLS     | Nginx `user-management` (80/443)                     |
| Base de datos   | PostgreSQL 16, `user_management` (solo localhost)    |
| Backups         | `/var/backups/user-management` y `vzdump` del CT 100 |
