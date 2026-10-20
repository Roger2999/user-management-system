# Guía de Implementación en Proxmox (LXC) con TLS interno

Versión 2 — Arquitectura revisada para despliegue en LAN empresarial.

- **Contenedor LXC** (Ubuntu 24.04) en lugar de VM completa.
- **HTTPS obligatorio** mediante una **CA interna (step-ca)**: la aplicación (Next.js 16 + Better Auth) exige TLS en producción. Sin HTTPS, el login falla silenciosamente (cookies `Secure`), los assets no cargan (CSP `upgrade-insecure-requests`) y Better Auth rechaza orígenes no declarados.
- **systemd** en lugar de PM2: menos capas, un solo proceso.
- Backups y actualizaciones documentados.

## Arquitectura objetivo

```
Proxmox VE
└── LXC 100 (Ubuntu 24.04, 2 vCPU / 4 GB / 30 GB)
    ├── PostgreSQL 16          base de datos (solo localhost)
    ├── Node.js 22 LTS         runtime Next.js
    ├── step-ca (127.0.0.1:8443)  CA interna, emite cert TLS
    ├── ums-app (127.0.0.1:3000)  app Next.js (servicio systemd)
    ├── cert-renew (daemon)       renueva el cert y recarga nginx
    └── Nginx (443 TLS)           proxy reverso, termina HTTPS
        ▲
 DNS interno:  ums.elecmtz.une.cu  →  IP del LXC
 Clientela:    navegadores confían en el root de la CA interna (GPO)
```

- Dominio: `ums.elecmtz.une.cu` (resolución **solo interna**; la zona pública la administra el nivel nacional y no se toca).
- Certificado: emitido por nuestra propia CA interna → ninguna dependencia del DNS nacional ni de internet.
- Renovación: automática (daemon de `step ca renew`).

---

## 1. Requisitos previos

| Requisito                           | Detalle                                          |
| ----------------------------------- | ------------------------------------------------ |
| Servidor Proxmox                    | Acceso root o usuario con permisos sobre el nodo |
| Plantilla Ubuntu 24.04              | Descargable desde Proxmox (`pveam`)              |
| IP estática libre en la LAN         | P. ej. `192.168.1.100/24`                        |
| DNS interno                         | Registrar `ums.elecmtz.une.cu` → IP del LXC      |
| Acceso de escritura a `lib/auth.ts` | Un cambio de una línea (sección 3)               |
| GPO o admin local en los clientes   | Para confiar el root de la CA (sección 14)       |

> **Importante:** la app **no** funciona por HTTP en producción. El acceso siempre será `https://ums.elecmtz.une.cu` (o por IP con warning, solo para pruebas).

---

## 2. Decisiones de esta arquitectura (por qué)

1. **HTTPS sí o sí.** `lib/auth.ts:42-47` activa cookies `Secure` cuando `NODE_ENV=production`; `next.config.ts:24` fuerza `upgrade-insecure-requests`; `lib/auth.ts:74` valida `trustedOrigins`. Sin TLS, el login parece funcionar pero no persiste, y los assets se rompen.
2. **CA interna y no Let's Encrypt.** La zona `ums.elecmtz.une.cu` es respondida públicamente por `ns.unionelectrica.cu` / `ns1.unionelectrica.cu` (SOA `admin.une.cu`), fuera de nuestro control. Let's Encrypt leería el desafío DNS-01 de esos servidores, no de nuestro DNS interno → dependeríamos del nivel nacional. Una CA interna (step-ca) elimina esa dependencia.
3. **LXC en vez de VM.** Menos recursos, backups nativos `vzdump` más rápidos, suficiente aislamiento para una herramienta interna.
4. **systemd en vez de PM2.** Un solo proceso, unidad declarativa, logs con `journalctl`.

---

## 3. Origen permitido en Better Auth

El repositorio ya incluye el origen de producción. Verificar que `lib/auth.ts` (~línea 74) tenga exactamente:

```ts
  trustedOrigins: [
    "http://localhost:3000",
    "https://sigel-eemtz.vercel.app",
    "https://ums.elecmtz.une.cu",
  ],
```

> No agregar `http://ums.elecmtz.une.cu`: en producción se accede solo por HTTPS y las cookies son `Secure`. Un origen `http` solo agrega superficie sin aportar nada.

Si el archivo cambió, commitear antes de generar el build:

```bash
git add lib/auth.ts
git commit -m "feat: agregar origen de produccion interno a trustedOrigins"
git push origin main
```

> Si el dominio o el puerto cambian, actualizar también `BETTER_AUTH_URL` y `NEXT_PUBLIC_BETTER_AUTH_URL` (sección 7.3), el `server_name` de Nginx (sección 12), el SAN del certificado (sección 10), el `--dns` de la CA (sección 9.3) y el registro DNS (sección 13).

---

## 4. Crear el contenedor LXC en Proxmox

Ejecutar en el **shell del nodo Proxmox** (host, no dentro de ningún contenedor).

### 4.1 Descargar la plantilla

```bash
pveam update
pveam available --section system | grep ubuntu-24.04
pveam download local ubuntu-24.04-standard_24.04-2_amd64.tar.zst
```

> Si la versión exacta difiere, usar la que muestre `pveam list local`.

### 4.2 Crear el contenedor (CLI)

Reemplazar `localhost:local-lvm:30` por tu storage (`pvesm status` para listarlos), la IP y el gateway por los de tu red, y el DNS interno por el de la empresa.

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
```

> `--nameserver` debe apuntar al **DNS interno de la empresa**, no a `8.8.8.8`: `ums.elecmtz.une.cu` solo resuelve adentro.

### 4.3 Alternativa por WebUI

`Datacenter → local(pveam) → Templates → Download` y luego `Create CT` con los mismos valores (Unprivileged: sí; Nesting: no; IP estática + gateway; DNS interno en la parte de red).

### 4.4 Entrar al contenedor

```bash
pct enter 100
```

> Dentro del contenedor sos `root`. Los comandos de esta guía asumen ese usuario; si entrás por SSH con otro usuario, anteponé `sudo` a todo.

---

## 5. Configuración base del contenedor

```bash
apt update && apt upgrade -y
apt install -y curl git ca-certificates gnupg build-essential
timedatectl set-timezone America/Havana   # ajustar si aplica
```

### 5.1 Node.js 22 LTS (NodeSource)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node --version   # v22.x.x
npm --version    # 10.x.x
```

### 5.2 pnpm

```bash
npm install -g pnpm@12
pnpm --version
```

> Pinear la major 12: `pnpm-workspace.yaml` usa opciones nuevas (`allowBuilds`, `permissions`) que versiones viejas de pnpm pueden rechazar.
> Verificar dónde queda el binario (`which pnpm`) porque se usa en las unidades de systemd (normalmente `/usr/local/bin/pnpm`).

---

## 6. PostgreSQL 16

Ubuntu 24.04 trae PostgreSQL 16 por defecto. La base se queda **solo en localhost** (la app corre en el mismo contenedor).

### 6.1 Instalar y arrancar

```bash
apt install -y postgresql postgresql-contrib
systemctl enable --now postgresql
systemctl status postgresql
```

### 6.2 Crear usuario y base de datos

Generar una contraseña fuerte:

```bash
openssl rand -base64 24
```

Luego:

```bash
sudo -u postgres psql
```

Dentro de `psql`:

```sql
CREATE USER user_management WITH PASSWORD '<CONTRASEÑA_FUERTE>';
CREATE DATABASE user_management OWNER user_management;
\c user_management
CREATE EXTENSION IF NOT EXISTS citext;
\q
```

### 6.3 Verificar conexión (método TCP, igual que usará la app)

```bash
psql "postgresql://user_management:<CONTRASEÑA_FUERTE>@127.0.0.1:5432/user_management" -c "SELECT 1;"
```

> No hace falta tocar `pg_hba.conf`: el default de Ubuntu ya habilita `scram-sha-256` para `127.0.0.1/32`, que es lo que usamos. No exponer PostgreSQL a la red (default: solo escucha en localhost).

---

## 7. Clonar la aplicación y preparar el entorno

### 7.1 Usuario de la aplicación

```bash
useradd --system --home /opt/user-management-system --shell /usr/sbin/nologin ums
mkdir -p /opt/user-management-system
chown -R ums:ums /opt/user-management-system
```

### 7.2 Clonar

```bash
git clone https://github.com/Roger2999/user-management-system.git /opt/user-management-system
chown -R ums:ums /opt/user-management-system
```

### 7.3 Archivo `.env` de producción

Crear `/opt/user-management-system/.env` con estos valores (reemplazar los `<...>`):

```env
# ====== BD ======
DATABASE_URL="postgresql://user_management:<CONTRASEÑA_FUERTE>@127.0.0.1:5432/user_management"

# ====== AUTENTICACIÓN ======
# Generar con: openssl rand -base64 32
BETTER_AUTH_SECRET=<SECRETO_ALEATORIO>
BETTER_AUTH_URL=https://ums.elecmtz.une.cu
NEXT_PUBLIC_BETTER_AUTH_URL=https://ums.elecmtz.une.cu

# ====== ENTORNO ======
NODE_ENV=production

# ====== EMAIL (RESEND) ======
# Recomendada. Sin una clave válida, la recuperación de contraseña falla
# (el error queda en el log) pero el build y el resto de la app funcionan:
# `lib/resend.ts` usa un placeholder para no romper el import.
# El remitente actual (onboarding@resend.dev) es de prueba; para producción
# se necesita un dominio verificado en Resend.
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

Proteger y dar propiedad:

```bash
chown ums:ums /opt/user-management-system/.env
chmod 600 /opt/user-management-system/.env
```

> **Importante:** las variables `NEXT_PUBLIC_*` se incrustan en el bundle en tiempo de **build**. Por eso el `.env` debe existir **antes** de `pnpm build`. Las variables de servidor (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`) se leen en tiempo de ejecución.

### 7.4 Instalar dependencias

```bash
cd /opt/user-management-system
sudo -u ums pnpm install
```

> `postinstall` regenera el cliente Prisma (`generated/`). No necesita la base de datos para generarse.

> **⚠️ No cargar el `.env` antes de `pnpm install`.** El `.env` define `NODE_ENV=production`; si lo hacés con `set -a; . ./.env`, pnpm omite las `devDependencies` (`prisma`, `tsx`, `typescript`) y el build posterior falla. Instalá sin sourcear el `.env`.

> **Registry:** el repo trae `.npmrc` apuntando a `https://registry.npmmirror.com/`. El contenedor necesita salida a ese mirror; si la red de la empresa lo bloquea, cambiá el registry (por ejemplo a `https://registry.npmjs.org/`) antes de instalar.

### 7.5 Aplicar migraciones

```bash
cd /opt/user-management-system
sudo -u ums bash -lc 'set -a; . ./.env; set +a; pnpm exec prisma migrate deploy'
```

> `prisma migrate deploy` (no interactivo) aplica las migraciones pendientes. La extensión `citext` ya está creada.
>
> En un despliegue nuevo, corré además `pnpm db:seed` para crear el administrador inicial (ver sección 15.1).

### 7.6 Compilar

```bash
cd /opt/user-management-system
sudo -u ums bash -lc 'set -a; . ./.env; set +a; pnpm build'
```

> `prebuild` regenera el cliente Prisma. El build debe hacerse con el `.env` cargado para que `NEXT_PUBLIC_BETTER_AUTH_URL` quede incrustado.

> **Fuentes:** `app/layout.tsx` usa `next/font/google` (Geist), que descarga las fuentes **durante el build**. El LXC necesita salida a `fonts.googleapis.com` al compilar (o migrar a `next/font/local`). En runtime no hay dependencia externa: Next autoaloja las fuentes y el CSP ya permite `font-src 'self'`.

---

## 8. Servicio systemd de la aplicación

Crear `/etc/systemd/system/ums-app.service`:

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

Activar y verificar:

```bash
systemctl daemon-reload
systemctl enable --now ums-app
systemctl status ums-app
curl -s http://127.0.0.1:3000 | head -c 200
```

---

## 9. CA interna con step-ca

Instalamos la CA **dentro del mismo LXC** (solo escucha en `127.0.0.1:8443`). Su único trabajo: emitir y renovar el certificado TLS del servidor.

### 9.1 Instalar `step-cli` y `step-ca`

```bash
cd /tmp
curl -LO https://dl.smallstep.com/gh-release/cli/docs-ca-install/step-cli_amd64.tar.gz
tar -xzf step-cli_amd64.tar.gz
cp step-cli_amd64/bin/step /usr/local/bin/

curl -LO https://dl.smallstep.com/gh-release/ca/docs-ca-install/step-ca_amd64.tar.gz
tar -xzf step-ca_amd64.tar.gz
cp step-ca_amd64/bin/step-ca /usr/local/bin/

step version && step-ca version
```

> Si las URLs dejan de funcionar por cambios de versión, buscar la URL actual en https://smallstep.com/docs/step-ca/installation/.

### 9.2 Usuario y carpeta de la CA

```bash
useradd --system --home /etc/step-ca --shell /usr/sbin/nologin step
install -d -o step -g step -m 0750 /etc/step-ca
install -d -o step -g step -m 0750 /etc/step-ca/secrets
```

Generar dos contraseñas (una para la clave raíz de la CA, otra para el provisioner admin) con `openssl rand -base64 24` y escribirlas en archivos:

```bash
openssl rand -base64 24 > /etc/step-ca/secrets/ca-password
openssl rand -base64 24 > /etc/step-ca/secrets/provisioner-password
chown step:step /etc/step-ca/secrets/ca-password /etc/step-ca/secrets/provisioner-password
chmod 600 /etc/step-ca/secrets/ca-password /etc/step-ca/secrets/provisioner-password
```

> Ajustar nombres/permisos si se usaron otros archivos: los secretos deben ser legibles solo por el usuario `step`.

### 9.3 Inicializar la CA (no interactivo)

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

Esto crea en `/etc/step-ca/`:

- `config/ca.json` — configuración
- `certs/root_ca.crt` — certificado raíz (para distribuir)
- `secrets/root_ca_key`, `intermediate_ca_key` — **claves privadas: críticas**
- `db/` — base de datos interna de la CA

### 9.4 Servicio systemd de la CA

Crear `/etc/systemd/system/step-ca.service`:

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

Activar:

```bash
systemctl daemon-reload
systemctl enable --now step-ca
systemctl status step-ca
journalctl -u step-ca -n 20 --no-pager
```

---

## 10. Emitir el certificado TLS del servidor

### 10.1 Emitir leaf con SAN `ums.elecmtz.une.cu`, validez 1 año

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
```

> `8760h` = 1 año. El SAN (DNS: ums.elecmtz.une.cu) se toma del subject automáticamente.

### 10.2 Armar la cadena (leaf + root) para Nginx

```bash
cp /etc/step-ca/certs/root_ca.crt /etc/ssl/private/step/root_ca.crt
cat /etc/step-ca/certs/root_ca.crt >> /etc/ssl/private/step/elecmtz.crt
```

> La renovación automática (sección 11) reescribe `elecmtz.crt` con la cadena completa de la CA, así que no hay que volver a concatenar.

### 10.3 Permisos

```bash
chown root:ssl-cert /etc/ssl/private/step/elecmtz.key
chmod 640 /etc/ssl/private/step/elecmtz.key
chmod 644 /etc/ssl/private/step/elecmtz.crt /etc/ssl/private/step/root_ca.crt
```

### 10.4 Verificar el certificado

```bash
step certificate inspect /etc/ssl/private/step/elecmtz.crt | head -25
```

Confirmar: `Not After` ≈ 1 año, SAN `ums.elecmtz.une.cu`, issuer = `UMS CA Interna`.

---

## 11. Renovación automática del certificado

Usamos `step ca renew --daemon`: se autentica contra la CA con **mTLS** (el propio certificado + clave), sin necesidad de contraseñas en cada renovación, y recarga Nginx cuando renueva.

Crear `/etc/systemd/system/ums-cert-renew.service`:

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

Activar:

```bash
systemctl daemon-reload
systemctl enable --now ums-cert-renew
systemctl status ums-cert-renew
```

> El daemon renueva cuando falta 1/3 de la vida del cert (con 1 año, ~mes 8) y vuelve a planificar solo. Tras renovar, ejecuta `systemctl reload nginx`. Si la CA está caída, reintenta y Nginx sigue sirviendo el cert vigente.

---

## 12. Nginx (proxy reverso + TLS)

### 12.1 Instalar

```bash
apt install -y nginx
```

### 12.2 Configuración del sitio

Crear `/etc/nginx/sites-available/user-management`:

```nginx
# Redirigir HTTP → HTTPS
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
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;

    client_max_body_size 50M;

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
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

> Nota: en `listen 443 ssl http2;`, la forma `http2` inline es la compatible con el Nginx de Ubuntu 24.04 (1.24). En Nginx ≥ 1.25.1 se puede usar `http2 on;` dentro del server.

Activar y verificar:

```bash
ln -s /etc/nginx/sites-available/user-management /etc/nginx/sites-enabled/
# Eliminar el sitio por defecto si no se usa
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx
```

### 12.3 Prueba local con el root confiado (opcional, en el LXC)

```bash
STEPPATH=/etc/step-ca step certificate install /etc/step-ca/certs/root_ca.crt
curl -sS https://ums.elecmtz.une.cu | head -c 200
```

---

## 13. DNS interno

En el **servidor DNS interno de la empresa**, crear el registro:

```
ums.elecmtz.une.cu.    IN    A    <IP_DEL_LXC>
```

Opcional (recomendado): reverse `PTR` si la empresa lo administra.

Verificar desde una PC de la red:

```bash
nslookup ums.elecmtz.une.cu
# debe devolver la IP del LXC
```

---

## 14. Confiar el root de la CA en toda la empresa

El navegador solo mostrará el candado sin advertencias si confía en el **root** de la CA interna. El archivo es `/etc/ssl/private/step/root_ca.crt` (del LXC).

### 14.1 Distribución masiva por GPO (recomendado, clientes Windows)

1. Copiar `root_ca.crt` a un recurso accesible en la red (share o GPO).
2. `gpmc.msc` → crear/editar un GPO que aplique al OU de las PC.
3. `Computer Configuration → Policies → Windows Settings → Security Settings → Public Key Policies → Trusted Root Certification Authorities`.
4. Botón derecho → `Import...` → seleccionar `root_ca.crt` → `Trusted Root Certification Authorities`.
5. En cada PC: `gpupdate /force`. Verificar con `certlm.msc` que el root aparece en “Entidades de certificación raíz de confianza”.

### 14.2 Manual (Windows)

En la PC, consola administrativa:

```powershell
step certificate install root_ca.crt
```

o: `certlm.msc` → Entidades de certificación raíz de confianza → Importar → `root_ca.crt`.

### 14.3 Linux (clientes)

```bash
sudo cp root_ca.crt /usr/local/share/ca-certificates/ums-root.crt
sudo update-ca-certificates
```

### 14.4 macOS

Doble clic en `root_ca.crt` → Llavero del sistema → `Siempre confiar`.

> **Esperado:** hasta que el root esté distribuido, el navegador mostrará un aviso “no se pudo verificar”. Eso se corrige con la instalación del root, no es un problema del certificado.

---

## 15. Verificación final end-to-end

Desde una PC de la red (con el root confiado):

| #   | Paso      | Comando/acción                                                     | Esperado                                                   |
| --- | --------- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| 1   | DNS       | `nslookup ums.elecmtz.une.cu`                                      | IP del LXC                                                 |
| 2   | TLS       | `curl -v https://ums.elecmtz.une.cu`                               | handshake OK, cadena leaf→root                             |
| 3   | App       | Abrir `https://ums.elecmtz.une.cu`                                 | Página de login, sin warning                               |
| 4   | Login     | Crear/entrar con un usuario                                        | Redirige a `/dashboard` y **se mantiene** logueado         |
| 5   | Cookie    | DevTools → Application → Cookies                                   | `better-auth.session_token`: flag `Secure`, `SameSite=Lax` |
| 6   | HTTP      | Abrir `http://ums.elecmtz.une.cu`                                  | Redirige a `https://`                                      |
| 7   | Servicios | `systemctl status ums-app step-ca ums-cert-renew nginx postgresql` | todos `active (running)`                                   |

### 15.1 Primer administrador

El registro público está deshabilitado. En un despliegue nuevo, creá el admin inicial con:

```bash
cd /opt/user-management-system
sudo -u ums bash -lc 'set -a; . ./.env; set +a; pnpm db:seed'
```

Crea `admin` / `admin` (configurable con `SEED_ADMIN_*`) **solo si la tabla `user` está vacía**. Después del primer login, cambiá la contraseña desde Configuración. Para promover a un usuario existente:

```bash
sudo -u ums bash -lc 'set -a; . ./.env; set +a; pnpm exec tsx prisma/promote-admin.ts <username>'
```

---

## 16. Backups y restauración

### 16.1 Base de datos (diaria)

Crear `/usr/local/sbin/backup-ums-db.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
BACKUP_DIR="/var/backups/user-management"
DB_NAME="user_management"
DB_USER="user_management"
DB_HOST="127.0.0.1"
export PGPASSWORD='<CONTRASEÑA_FUERTE>'
mkdir -p "$BACKUP_DIR"
pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz"
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete
```

```bash
chmod +x /usr/local/sbin/backup-ums-db.sh
crontab -e
# Agregar línea:
# 0 2 * * * /usr/local/sbin/backup-ums-db.sh >/dev/null 2>&1
```

### 16.2 CA interna (crítico)

**Si se pierden las claves de `/etc/step-ca`, todos los certificados emitidos dejan de ser confiables.** Incluir una copia de:

- `/etc/step-ca/` (config, `secrets/`, `certs/`, `db/`)
- `/etc/ssl/private/step/`

en un destino externo al LXC (otro contenedor/VM, NAS o el backup `vzdump`). Las contraseñas de `secrets/` también deben guardarse fuera.

### 16.3 Contenedor completo (Proxmox)

Programar backup del CT 100 en Proxmox:

```
Datacenter → <nodo> → Backup → Add
   Schedule: 02:00 daily
   Storage: <destino>
   Vzdump options: Compression: ZSTD, Mode: Snapshot
   Include: CT 100
```

### 16.4 Restauración de la BD

```bash
gunzip -c /var/backups/user-management/backup_YYYYMMDD_HHMMSS.sql.gz | \
  psql "postgresql://user_management:<CONTRASEÑA_FUERTE>@127.0.0.1:5432/user_management"
```

---

## 17. Actualización de la aplicación

Crear `/usr/local/sbin/update-ums.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
APP="/opt/user-management-system"
cd "$APP"
sudo -u ums git pull --ff-only
sudo -u ums pnpm install
sudo -u ums bash -lc 'set -a; . ./.env; set +a; pnpm exec prisma migrate deploy'
sudo -u ums bash -lc 'set -a; . ./.env; set +a; pnpm db:seed'
sudo -u ums bash -lc 'set -a; . ./.env; set +a; pnpm build'
systemctl restart ums-app
echo "OK: ums-app actualizado"
```

Ejecutar:

```bash
sudo /usr/local/sbin/update-ums.sh
```

> Un cambio en `trustedOrigins` o en cualquier `NEXT_PUBLIC_*` exige **rebuild** (ya lo hace el script). Un cambio solo de migraciones no requiere rebuild, pero el script es seguro para ambos casos.

---

## 18. Troubleshooting

| Síntoma                                          | Causa probable                                                                                 | Solución                                                                                                                   |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Login no persiste (vuelve a `/signin`)           | Se accedió por HTTP o por IP, o falta `trustedOrigins`                                         | Acceder siempre por `https://ums.elecmtz.une.cu`; verificar `ums.elecmtz.une.cu` en `trustedOrigins` (sección 3) y rebuild |
| Navegador: “no se pudo verificar el certificado” | Root de la CA no instalado en ese equipo                                                       | Sección 14 (GPO o manual)                                                                                                  |
| Error `502 Bad Gateway` en Nginx                 | App caída                                                                                      | `systemctl status ums-app`; `journalctl -u ums-app -n 50`; revisar `.env`                                                  |
| `Connection refused` a la BD                     | PostgreSQL caído o `DATABASE_URL` mal                                                          | `systemctl status postgresql`; probar conexión con `psql` (sección 6.3)                                                    |
| El certificado no se renueva                     | `step-ca` o `ums-cert-renew` caídos                                                            | `systemctl status step-ca ums-cert-renew`; `journalctl -u ums-cert-renew -n 50`                                            |
| Prisma: extension `citext` no existe             | No se creó la extensión                                                                        | `sudo -u postgres psql -d user_management -c "CREATE EXTENSION IF NOT EXISTS citext;"`                                     |
| Emails de reset no llegan                        | Sin `RESEND_API_KEY` (se usa el placeholder), clave inválida o dominio no verificado en Resend | Configurar una clave real y verificar el dominio remitente; revisar el log de `ums-app`                                    |
| Cambié la URL y no toma                          | `NEXT_PUBLIC_*` se incrusta en build                                                           | Rebuild + restart (sección 17)                                                                                             |

---

## 19. Resumen de archivos y servicios

| Elemento             | Ruta / servicio                                             |
| -------------------- | ----------------------------------------------------------- |
| App (código)         | `/opt/user-management-system` (usuario `ums`)               |
| Variables de entorno | `/opt/user-management-system/.env` (modo 600)               |
| Servicio de la app   | `ums-app.service` (Next.js en `127.0.0.1:3000`)             |
| CA interna           | `/etc/step-ca` (usuario `step`), servicio `step-ca.service` |
| Certificado TLS      | `/etc/ssl/private/step/elecmtz.crt` + `.key`                |
| Root de la CA        | `/etc/ssl/private/step/root_ca.crt`                         |
| Renovación           | `ums-cert-renew.service`                                    |
| Proxy / TLS          | Nginx `user-management` (443/80)                            |
| Base de datos        | PostgreSQL 16, `user_management` (solo localhost)           |
| Backups              | `/var/backups/user-management` (BD), `vzdump` del CT 100    |

---

## 20. Notas finales

- El despliegue es 100% interno: **no se expone nada a internet** y no depende del nivel nacional para emitir ni renovar certificados.
- La renovación de un cert de 1 año ocurre ~al mes 8 automáticamente; verificar de vez en cuando con `step certificate inspect /etc/ssl/private/step/elecmtz.crt | grep -A1 "Not After"`.
- Si más adelante se necesita emitir certificados para otros servicios (Wi-Fi, otros servidores), la misma CA interna puede usarse con `step ca certificate`; en ese caso evalúa exponer la CA en `8443` detrás de Nginx con autenticación.
