# Guía de Despliegue: Control Bus en VPS con EasyPanel

Esta guía está optimizada para tu infraestructura actual que incluye **EasyPanel, Portainer, Chatwoot y n8n**.

---

## 🖼️ Opción A: Despliegue con EasyPanel (Recomendado)

Dado que ya tienes **EasyPanel**, lo más sencillo es usarlo para gestionar el ciclo de vida, SSL y dominios automáticamente.

### 1. Crear un nuevo Proyecto en EasyPanel
Nómbralo `control-bus`.

### 2. Servicio Backend (Express)
1.  Crea un servicio tipo **App**.
2.  **Source**: Conecta tu GitHub y elige la rama `feature/profiles-and-permissions`.
3.  **Build**: 
    - Elige `Dockerfile`.
    - Path: `./Dockerfile` (en la raíz).
4.  **Environment Variables**: Configura las de `.env.example`.
    - `DATABASE_URL`: Usa una base de datos de EasyPanel o externa.
5.  **Domain**: Configura tu dominio para el API (ej: `api.tudominio.com`).

### 3. Servicio Frontend (Next.js)
1.  Crea otro servicio tipo **App**.
2.  **Source**: Misma rama de GitHub.
3.  **Build**:
    - Elige `Dockerfile`.
    - Path: `./frontend/Dockerfile`.
    - **Build Args**: Añade `NEXT_PUBLIC_API_URL` apuntando a la URL pública de tu API (ej: `https://api.tudominio.com/api`).
4.  **Domain**: Configura tu dominio principal (ej: `tudominio.com`).

---

## ⚡ Integración con n8n (Automatización Avanzada)

Ya que tienes **n8n** instalado, puedes potenciar el sistema:
-   **Webhooks intermedios**: Envía los webhooks de Traccar primero a n8n para filtrarlos antes de mandarlos a `control-bus`.
-   **Notificaciones**: Usa n8n para enviar alertas por Telegram o WhatsApp cuando se detecte una infracción.

---

## 🐋 Opción B: Docker Compose Manual

Si prefieres usar Portainer, utiliza el `docker-compose.yml` del proyecto.
-   El sistema escuchará en el puerto **8081** para evitar conflictos con tus otras aplicaciones.
-   Usa un Proxy Inverso (como el de EasyPanel) para mapear tu dominio al puerto 8081.

---

## 🛠️ Base de Datos en Producción
Para sincronizar las tablas por primera vez:
```bash
docker exec -it control-bus-backend npx prisma db push
```

---

## 🔄 Actualización de Cambios (EasyPanel)

Para subir cualquier cambio que hagas localmente al servidor:

1. **En tu PC (Local)**: Guarda, haz commit y sube el código a GitHub:
   ```bash
   git add .
   git commit -m "Descripción de lo que cambiaste"
   git push origin feature/profiles-and-permissions
   ```

2. **En EasyPanel**:
   - Ve al servicio que quieras actualizar (`controlbus` o `frontend`).
   - Haz clic en el botón verde **Implementar** (Deploy).
   - EasyPanel descargará el código nuevo y reconstruirá el servicio automáticamente.

> [!TIP]
   - Si solo cambiaste el estilo del diseño, solo necesitas "Implementar" el `frontend`.
   - Si cambiaste la base de datos o lógica del servidor, solo el `backend` (`controlbus`).

## 🗄️ Si cambias la Base de Datos
Si añades nuevas tablas o columnas en local, después de hacer el `git push`, ve a la **Consola** del backend en EasyPanel y ejecuta:
```bash
npx prisma db push
```
