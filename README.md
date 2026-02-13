# Control Bus - Sistema de Gestión de Infracciones y Flotas

Sistema integral multi-tenant diseñado para la supervisión de transporte público y privado, integrando datos en tiempo real de **Traccar** para la detección automática de infracciones y gestión de multas.

## 🚀 Características Principales

### 🏢 Arquitectura Multi-Tenant
- Aislamiento total de datos por empresa (Tenant).
- Configuración personalizada de SMTP e identidad por cada cliente.

### ⚖️ Motor de Reglas e Infracciones
- **Exceso de Velocidad**: Por zona específica o global.
- **Tiempos de Tramo**: Control detallado de tiempo entre geocercas (Parada A -> Parada B).
- **Permanencia en Parada (Dwell Time)**: Detección de tiempos mínimos y máximos en puntos clave.
- **Multas en USD**: Generación automática de montos base y penalizaciones por minuto/kmh de exceso.

### 👤 Gestión Avanzada de Permisos
- **Sistema de Perfiles**: Crea perfiles personalizados (ej. Operador, Contador) con permisos granulares.
- **Control de Borrado Masivo**: Restricción específica para la eliminación de múltiples registros.
- **Herencia de Roles**: Mezcla inteligente de permisos manuales y por perfil.

### 📱 Interfaz Premium y Responsiva
- **Next.js 14 App Router**: Una experiencia de usuario ultra rápida y fluida.
- **Diseño Mobile-First**: Panel totalmente funcional en celulares y tablets.
- **Mapa en Tiempo Real**: Visualización de rutas y geocercas mediante Leaflet.

### 📧 Automatización y Notificaciones
- **Portal de Propietario (Magic Link)**: Acceso seguro para dueños de vehículos sin necesidad de cuenta.
- **Reportes Consolidados**: Resúmenes automáticos por email para evitar saturación.
- **Generación de PDFs**: Tickets de multas y reportes descargables al instante.

## 🛠️ Stack Tecnológico

- **Frontend**: React 18, Next.js 14, TailwindCSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express, TypeScript.
- **Base de Datos**: PostgreSQL + Prisma ORM.
- **Procesamiento**: Node-cron para tareas en segundo plano.

## 📦 Guía de Instalación Rápida

### Requisitos
- Docker y Docker Compose instalados.
- Un servidor Traccar activo para enviar webhooks.

### Pasos
1. **Configuración Inicial**:
   ```bash
   cp .env.example .env
   # Edita .env con tus credenciales de Postgres y Token de Traccar
   ```

2. **Despliegue con Docker**:
   ```bash
   docker-compose up -d --build
   ```

3. **Base de Datos**:
   ```bash
   docker-compose exec backend npx prisma db push
   ```

## 📂 Estructura del Proyecto

- `/src`: Backend API y servicios de lógica.
- `/frontend`: Aplicación Next.js.
- `/prisma`: Esquema y migraciones de la base de datos.
- `/scripts`: Herramientas de utilidad para mantenimiento (backups, reseteo de claves).

## 📄 Licencia
Propiedad de Control Bus. Todos los derechos reservados.
