# Guía de Implementación en Proxmox

Este documento describe los pasos para implementar el Sistema de Gestión de Usuarios en un servidor Proxmox con PostgreSQL local en la red empresarial.

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Paso 1: Preparar VM en Proxmox](#paso-1-preparar-vm-en-proxmox)
3. [Paso 2: Instalar Dependencias](#paso-2-instalar-dependencias)
4. [Paso 3: Clonar Repositorio](#paso-3-clonar-repositorio)
5. [Paso 4: Configurar PostgreSQL](#paso-4-configurar-postgresql)
6. [Paso 5: Configurar Variables de Entorno](#paso-5-configurar-variables-de-entorno)
7. [Paso 6: Ejecutar Migraciones](#paso-6-ejecutar-migraciones)
8. [Paso 7: Configurar Reverse Proxy (Nginx)](#paso-7-configurar-reverse-proxy-nginx)
9. [Paso 8: Compilar y Ejecutar la Aplicación](#paso-8-compilar-y-ejecutar-la-aplicación)
10. [Paso 9: Automatizar con PM2](#paso-9-automatizar-con-pm2)
11. [Paso 10: Configurar Red Empresarial](#paso-10-configurar-red-empresarial)
12. [Verificación Final](#verificación-final)
13. [Troubleshooting](#troubleshooting)

---

## Requisitos Previos

✅ **Hardware mínimo en Proxmox:**
- CPU: 2 cores
- RAM: 4 GB (recomendado 8 GB)
- Disco: 50 GB

✅ **Acceso a Proxmox** con permisos de administrador

✅ **IP estática** para la VM

---

## Paso 1: Preparar VM en Proxmox

### 1.1 Crear la Máquina Virtual

**En el panel de Proxmox:**

1. Click en **"Create VM"** o **"Crear VM"**
2. **Básico:**
   - Node: Selecciona tu nodo Proxmox
   - VM ID: 100 (o el siguiente disponible)
   - Nombre: `user-management-system`
3. **SO:**
   - Selecciona ISO: Ubuntu Server 22.04 LTS (descargable desde Proxmox)
4. **Disco:**
   - Tamaño: 50 GB
   - Almacenamiento: local o tu storage
5. **CPU:**
   - Cores: 2
6. **Memoria:**
   - RAM: 4096 MB (4 GB)
7. **Red:**
   - Bridge: vmbr0 (o tu bridge)
   - VLAN: (si lo requiere tu red)

**Inicia la VM y completa la instalación de Ubuntu.**

### 1.2 Configurar IP Estática

Una vez dentro de Ubuntu:

```bash
# Editar netplan
sudo nano /etc/netplan/01-netcfg.yaml
```

**Contenido:**

```yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: false
      addresses:
        - 192.168.1.100/24  # Ajusta a tu red empresarial
      gateway4: 192.168.1.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

```bash
# Aplicar cambios
sudo netplan apply

# Verificar
ip addr show
```

---

## Paso 2: Instalar Dependencias

### 2.1 Actualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Instalar Node.js 20 LTS

```bash
# Agregar repositorio de NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 2.3 Instalar pnpm (Gestor de Paquetes)

```bash
sudo npm install -g pnpm

# Verificar
pnpm --version
```

### 2.4 Instalar Git

```bash
sudo apt install -y git

# Configurar Git (opcional pero recomendado)
git config --global user.name "Tu Nombre"
git config --global user.email "tu@empresa.com"
```

### 2.5 Instalar PostgreSQL 15

```bash
sudo apt install -y postgresql postgresql-contrib

# Iniciar y habilitar servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar estado
sudo systemctl status postgresql
```

---

## Paso 3: Clonar Repositorio

### 3.1 Crear Directorio de Aplicación

```bash
# Crear directorio
sudo mkdir -p /opt/user-management-system
cd /opt/user-management-system

# Cambiar permisos (opcional para desarrollo)
sudo chown $USER:$USER /opt/user-management-system
```

### 3.2 Clonar Repositorio

```bash
cd /opt/user-management-system

git clone https://github.com/Roger2999/user-management-system.git .

# Verificar que se clonó correctamente
ls -la
```

### 3.3 Instalar Dependencias del Proyecto

```bash
pnpm install

# Esto descargará todas las dependencias (puede tardar 2-5 minutos)
```

---

## Paso 4: Configurar PostgreSQL

### 4.1 Crear Base de Datos y Usuario

```bash
# Acceder a PostgreSQL
sudo -u postgres psql

# Crear usuario (en el prompt de PostgreSQL):
CREATE USER user_management WITH PASSWORD 'contraseña_segura_aqui';

# Crear base de datos
CREATE DATABASE user_management OWNER user_management;

# Habilitar extensión citext (requerida por Prisma)
\c user_management
CREATE EXTENSION IF NOT EXISTS citext;

# Salir
\q
```

### 4.2 Verificar Conexión

```bash
# Probar conexión desde la terminal
psql -h localhost -U user_management -d user_management -c "SELECT version();"

# Ingresa la contraseña cuando se pida
```

---

## Paso 5: Configurar Variables de Entorno

### 5.1 Crear Archivo .env

```bash
cd /opt/user-management-system

# Crear archivo
nano .env
```

### 5.2 Contenido del .env

```env
# ====== AUTENTICACIÓN ======
# Genera un secreto aleatorio con: openssl rand -base64 32
BETTER_AUTH_SECRET=TuSecretoAleatorioGenerado==

# URL de acceso desde los clientes (en la red local)
BETTER_AUTH_URL=http://192.168.1.100:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://192.168.1.100:3000

# ====== BASE DE DATOS ======
DATABASE_URL="postgresql://user_management:contraseña_segura_aqui@localhost:5432/user_management"

# ====== EMAIL (RESEND) ======
# Opcional: Descomenta solo si tienes API key de Resend
# RESEND_API_KEY=re_xxxxxxxxxxxxx

# ====== ENTORNO ======
NODE_ENV=production
```

**Generar secreto seguro:**

```bash
openssl rand -base64 32
```

**Copiar el resultado al .env en `BETTER_AUTH_SECRET`**

### 5.3 Proteger el Archivo

```bash
chmod 600 .env
```

---

## Paso 6: Ejecutar Migraciones

### 6.1 Generar Cliente de Prisma

```bash
cd /opt/user-management-system

pnpm dlx prisma generate
```

### 6.2 Ejecutar Migraciones

```bash
pnpm dlx prisma migrate deploy
```

### 6.3 Verificar Base de Datos

```bash
# Abrir Prisma Studio (opcional)
pnpm dlx prisma studio

# Se abrirá en http://localhost:5555
# Verifica que las tablas se crearon correctamente
```

---

## Paso 7: Configurar Reverse Proxy (Nginx)

### 7.1 Instalar Nginx

```bash
sudo apt install -y nginx

# Habilitar al inicio
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 7.2 Crear Configuración de Nginx

```bash
sudo nano /etc/nginx/sites-available/user-management
```

**Contenido:**

```nginx
upstream app {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name 192.168.1.100 user-management.local user-management;
    
    # Aumentar límite de tamaño de cuerpo para formularios grandes
    client_max_body_size 50M;

    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        
        # Headers necesarios para Next.js
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Evitar problemas de caché
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts para aplicaciones lentas
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 7.3 Habilitar Sitio

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/user-management /etc/nginx/sites-enabled/

# Verificar sintaxis
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## Paso 8: Compilar y Ejecutar la Aplicación

### 8.1 Compilar para Producción

```bash
cd /opt/user-management-system

pnpm build

# Esto genera la carpeta .next/
```

### 8.2 Prueba Inicial

```bash
# Inicia en modo producción
pnpm start

# Deberías ver algo como:
# > user-managment-system@0.1.0 start
# > next start
# ▲ Next.js 16.2.6
#   - Local:        http://localhost:3000
```

**En otra terminal, prueba la conexión:**

```bash
curl http://localhost:3000
```

**Presiona Ctrl+C para detener la aplicación de prueba**

---

## Paso 9: Automatizar con PM2

### 9.1 Instalar PM2 Globalmente

```bash
sudo npm install -g pm2
```

### 9.2 Crear Archivo de Configuración

```bash
cd /opt/user-management-system

nano ecosystem.config.js
```

**Contenido:**

```javascript
module.exports = {
  apps: [
    {
      name: "user-management",
      script: "pnpm",
      args: "start",
      cwd: "/opt/user-management-system",
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Reiniciar si usa más de 1 GB de RAM
      max_memory_restart: "1G",
      // Logs
      out_file: "/var/log/user-management/out.log",
      error_file: "/var/log/user-management/error.log",
      log_file: "/var/log/user-management/combined.log",
      time_format: "YYYY-MM-DD HH:mm:ss Z",
      // Reinicio automático
      watch: false,
      ignore_watch: ["node_modules", ".next", "public"],
      // Health check
      listen_timeout: 3000,
      kill_timeout: 5000,
    },
  ],
};
```

### 9.3 Crear Directorio de Logs

```bash
sudo mkdir -p /var/log/user-management
sudo chown $USER:$USER /var/log/user-management
```

### 9.4 Iniciar la Aplicación con PM2

```bash
cd /opt/user-management-system

# Iniciar la aplicación
pm2 start ecosystem.config.js

# Verificar estado
pm2 status

# Ver logs
pm2 logs user-management

# Configurar para que inicie al reiniciar la VM
pm2 startup
pm2 save

# (Ejecuta el comando que te muestra pm2 startup)
```

### 9.5 Verificar que Está Corriendo

```bash
# En navegador o curl
curl http://localhost:3000

# O accede desde otra máquina
curl http://192.168.1.100
```

---

## Paso 10: Configurar Red Empresarial

### 10.1 Configurar DNS Local (Opcional pero Recomendado)

Si tienes un servidor DNS en tu red empresarial:

**Agregar registro:**

```dns
user-management.empresa.local  A  192.168.1.100
```

### 10.2 Abrir Puertos en Firewall

```bash
# Si Ubuntu tiene UFW habilitado
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp   # SSH

# Recargar UFW
sudo ufw reload
```

### 10.3 Configurar Acceso desde Otros Equipos

**En el archivo .env, ajusta la URL:**

```env
# Si el servidor tiene un nombre de dominio
BETTER_AUTH_URL=http://user-management.empresa.local
NEXT_PUBLIC_BETTER_AUTH_URL=http://user-management.empresa.local

# O usa la IP
BETTER_AUTH_URL=http://192.168.1.100
NEXT_PUBLIC_BETTER_AUTH_URL=http://192.168.1.100
```

**Reinicia la aplicación:**

```bash
pm2 restart user-management
```

---

## Verificación Final

### 11.1 Checklist de Verificación

```bash
# 1. Verificar que Node.js está instalado
node --version

# 2. Verificar PostgreSQL
sudo systemctl status postgresql

# 3. Verificar conexión a BD
psql -h localhost -U user_management -d user_management -c "SELECT COUNT(*) FROM \"user\";"

# 4. Verificar Nginx
sudo systemctl status nginx
curl http://localhost

# 5. Verificar PM2
pm2 status

# 6. Ver logs de la aplicación
pm2 logs user-management

# 7. Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
```

### 11.2 Acceder a la Aplicación

**Desde tu navegador:**

- **Local (VM):** http://localhost:3000
- **Desde otro PC en la red:** http://192.168.1.100
- **Si configuraste DNS:** http://user-management.empresa.local

### 11.3 Crear Primer Usuario

1. Ve a `/signup`
2. Completa el formulario:
   - **Username:** admin
   - **Email:** admin@empresa.com
   - **Password:** Contraseña segura
3. Click en "Registrarse"
4. Accede al dashboard

---

## Troubleshooting

### Problema: "Connection refused" en la BD

```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Ver logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Problema: Puertos ya en uso

```bash
# Buscar qué está usando el puerto 3000
sudo lsof -i :3000

# O el 80 (Nginx)
sudo lsof -i :80

# Matar proceso (si es necesario)
sudo kill -9 PID
```

### Problema: PM2 no inicia automáticamente

```bash
# Regenerar script de inicio
pm2 unstartup
pm2 startup
pm2 save

# O ejecuta el comando sugerido manualmente
```

### Problema: Nginx devuelve 502 Bad Gateway

```bash
# Verificar que la app está corriendo en 3000
pm2 status

# Reiniciar app
pm2 restart user-management

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
```

### Problema: Base de datos vacía después de migrar

```bash
# Ejecutar migraciones nuevamente
pnpm dlx prisma migrate deploy

# O si algo salió mal, resetear (cuidado: borra datos)
pnpm dlx prisma migrate reset
```

### Problema: Emails no se envían

**Si no tienes Resend configurado:**

1. Abre `lib/auth.ts`
2. Busca `sendResetPassword`
3. Comenta o desactiva esa sección (para desarrollo)
4. Redeploy:
   ```bash
   pnpm build
   pm2 restart user-management
   ```

---

## Mantenimiento

### Backup Automático de BD

```bash
# Crear script de backup
sudo nano /usr/local/bin/backup-user-management.sh
```

**Contenido:**

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/user-management"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="user_management"
DB_USER="user_management"

mkdir -p $BACKUP_DIR

pg_dump -h localhost -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Mantener solo últimos 7 backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completado: $BACKUP_DIR/backup_$TIMESTAMP.sql.gz"
```

```bash
# Hacer ejecutable
sudo chmod +x /usr/local/bin/backup-user-management.sh

# Agregar a cron (diariamente a las 2 AM)
sudo crontab -e

# Agregar línea:
# 0 2 * * * /usr/local/bin/backup-user-management.sh
```

### Actualizar Aplicación

```bash
cd /opt/user-management-system

# Obtener últimos cambios
git pull origin main

# Reinstalar dependencias (si hay cambios)
pnpm install

# Compilar
pnpm build

# Ejecutar migraciones (si hay cambios en BD)
pnpm dlx prisma migrate deploy

# Reiniciar
pm2 restart user-management
```

### Monitorear Recursos

```bash
# Ver consumo de recursos de PM2
pm2 monit

# Ver estado de PostgreSQL
sudo systemctl status postgresql

# Espacio en disco
df -h

# Procesos corriendo
pm2 status
```

---

## Información de Contacto y Soporte

Si tienes problemas:

1. Verifica los logs: `pm2 logs user-management`
2. Revisa el archivo de configuración `.env`
3. Consulta la documentación de Better Auth: https://better-auth.com
4. Abre un issue en: https://github.com/Roger2999/user-management-system/issues
