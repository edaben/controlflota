# Guía de Despliegue en VPS (Docker)

Toda la aplicación está "dockerizada", lo que facilita mucho el despliegue. Sigue estos pasos para subir tu aplicación a un servidor VPS (como DigitalOcean, Contabo, AWS, etc.).

## 1. Requisitos Previos en el VPS

Asegúrate de que tu servidor tenga **Docker** y **Git** instalados.

Si es un servidor nuevo (Ubuntu/Debian), ejecuta esto:

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Git y Curl
sudo apt install git curl -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose (si no vino con Docker)
sudo apt install docker-compose-plugin -y
```

## 2. Descargar el Código

Clona tu repositorio en la carpeta que prefieras (ej. `/var/www/control-bus` o en tu home `~/control-bus`).

```bash
git clone https://github.com/edaben/controlflota.git control-bus
cd control-bus
```

## 3. Configuración de Entorno (.env)

Necesitas crear el archivo `.env` con las credenciales de producción.

1.  Copia el ejemplo:
    ```bash
    cp .env.example .env
    ```

2.  Edita el archivo:
    ```bash
    nano .env
    ```

3.  **Variables Críticas a Configurar:**

    ```env
    # Puerto del backend (interno del contenedor)
    PORT=3000

    # URL de la base de datos (si usas la interna de docker, usa "db" como host)
    DATABASE_URL="postgresql://postgres:postgres@db:5432/control_bus?schema=public"

    # Secreto para JWT (CAMBIA ESTO por algo seguro)
    JWT_SECRET="clave-super-secreta-produccion-123"

    # URL Pública de tu API (IMPORTANTE)
    # Debe ser la IP de tu VPS o tu Dominio
    # Ejemplo con IP: http://123.45.67.89:3000/api
    # Ejemplo con Dominio: https://api.midominio.com/api
    API_URL="http://TU_IP_VPS:3000/api"
    ```

    Guarda con `Ctrl+O` y sal con `Ctrl+X`.

## 4. Iniciar la Aplicación

Una vez configurado, levanta los contenedores:

```bash
docker compose up -d --build
```

- `up`: Levanta los servicios.
- `-d`: En segundo plano (detached).
- `--build`: Reconstruye las imágenes (útil si hay cambios de código).

## 5. Verificar Estado

Comprueba que todo esté corriendo:

```bash
docker compose ps
```

Deberías ver 3 servicios: `db`, `backend`, `frontend`.

Para ver los logs si algo falla:
```bash
docker compose logs -f
```

## 6. Configuración de Dominio (Opcional pero Recomendado)

Si tienes un dominio, lo ideal es configurar **Nginx** como proxy inverso para tener HTTPS (candadito verde).

1.  Instala Nginx: `sudo apt install nginx -y`
2.  Configura un archivo en `/etc/nginx/sites-available/control-bus`.
3.  Proxy pass al puerto 3001 (Frontend) y 3000 (Backend/API).
4.  Usa Certbot para SSL gratuito.

---

## Solución de Problemas Comunes

### Error de Base de Datos (Migraciones)
Si la base de datos está vacía, es posible que necesites correr las migraciones manualmente dentro del contenedor:

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed
```

### La web no carga
1.  Verifica que el firewall del VPS permita los puertos 3000 y 3001.
    ```bash
    sudo ufw allow 3000
    sudo ufw allow 3001
    ```
2.  Verifica que `API_URL` en el `.env` sea correcta y accesible desde tu navegador.
