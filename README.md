# Sistema Control Bus - Multas e Infracciones USD

Sistema multi-tenant de gestión de infracciones diseñado para procesar alertas de Traccar y automatizar el cobro de multas.

## 🚀 Características Principales

- **Multi-Tenant:** Aislamiento total de datos por cliente (tenant).
- **Infracciones Automáticas:**
  - Exceso de velocidad (Overspeed).
  - Incumplimiento de tiempo en tramo (A -> B).
  - Exceso de tiempo en parada (Dwell time).
- **Multas en USD:** Configuración de montos por regla.
- **Reportes Consolidados:** Envío programado (diario/semanal) para evitar spam de correos.
- **Scheduler Interno:** Automatización de envíos y generación de PDFs.
- **Panel Premium:** Dashboard moderno basado en React + TailwindCSS.

## 🛠️ Stack Tecnológico

- **Backend:** Node.js, TypeScript, Express, Prisma ORM, PostgreSQL.
- **Frontend:** React, Vite, TailwindCSS, Lucide Icons.
- **Infraestructura:** Docker, Docker Compose.
- **Automatización:** Node-cron (Scheduler), Nodemailer (SMTP), PDFKit.

## 📦 Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repo>
   cd control-bus
   ```

2. **Configurar variables de entorno:**
   Copia el archivo `.env.example` a `.env` y completa los datos de tu base de datos y SMTP.

3. **Levantar con Docker:**
   ```bash
   docker-compose up -d --build
   ```

4. **Ejecutar migraciones de base de datos:**
   ```bash
   docker-compose exec backend npm run prisma:migrate
   ```

## 🚨 Recuperación ante Desastre (Disaster Recovery)

En caso de fallo total del servidor:

1. **Nueva Instancia:** Provisionar un nuevo servidor con Docker e instalar Git.
2. **Repositorio:** Clonar el repositorio en la nueva instancia.
3. **Backup de DB:** Si cuentas con un backup de PostgreSQL (`.sql`), restáuralo:
   ```bash
   cat backup.sql | docker exec -i control-bus-db-1 psql -U postgres -d control_bus
   ```
4. **Archivos PDF:** Los tickets y reportes generados se encuentran en el volumen persistente o carpeta `uploads/`. Asegúrate de restaurar esta carpeta si es crítica.
5. **Configuración:** Asegúrate de que el `.env` tenga las mismas claves (`JWT_SECRET`) para que los tokens antiguos no expiren (opcional).

## 📄 Licencia
Este proyecto es propiedad privada de Control Bus.
