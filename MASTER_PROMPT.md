# Master Prompt: Replicación del Sistema Control Bus

Usa este prompt para inicializar una nueva sesión con una IA o entregar a un programador senior para replicar o extender este sistema.

---

### **Contexto del Proyecto**
"Control Bus" es una plataforma SaaS multi-tenant diseñada para el monitoreo y sanción automática de infracciones de tránsito en flotas de transporte público/privado. El sistema recibe datos en tiempo real de un servidor **Traccar** vía Webhooks y aplica lógica de negocios para generar multas en dólares estadounidenses (USD).

### **Stack Tecnológico Requerido**
- **Frontend**: Next.js 14 (App Router), TailwindCSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js v20+, Express, TypeScript.
- **Base de Datos**: PostgreSQL con Prisma ORM.
- **Servicios**: Node-cron (tareas programadas), Nodemailer (SMTP), PDFKit (generación de documentos).

### **Arquitectura y Modelos (Prisma)**
El sistema debe implementar los siguientes modelos clave:
1.  **Tenant**: Aislamiento de empresas, configuración SMTP por separado.
2.  **User & Profile**: Sistema de roles (SUPER_ADMIN, CLIENT_ADMIN) y perfiles personalizados con permisos granulares (ej: `manage:users`, `manage:bulk_delete`).
3.  **Vehicle**: Vinculado a un `traccarDeviceId`. Incluye datos del propietario y un `ownerToken` único.
4.  **Route & Stop**: Definición de trayectorias y geocercas asociadas a Traccar.
5.  **Reglas (Rules)**:
    - `SegmentRule`: Tiempo máx/mín entre Parada A y B.
    - `StopRule`: Tiempo de permanencia permitido en una parada.
    - `SpeedZone`: Límites de velocidad específicos por zona o globales.
6.  **Infraction & Fine**: Registro de violaciones y su correspondiente cobro en USD.

### **Lógica Crítica a Replicar**
1.  **Procesamiento de Webhooks**:
    - Escuchar eventos `deviceOnline`, `deviceOffline`, `geofenceEnter` y `geofenceExit`.
    - Registrar llegadas y salidas de paradas para calcular `dwellTime`.
    - Comparar tiempos de salida de A con llegada a B para validar `SegmentRules`.
2.  **Sistema de Permisos**:
    - Un middleware de `authorize` que combine permisos directos del usuario con los de su `Profile`.
    - Restricción de acciones de borrado masivo basada en el permiso `manage:bulk_delete`.
3.  **Portal de Propietario**:
    - Ruta pública `/owner/[token]` que permite a dueños de buses ver sus infracciones y descargar PDFs sin autenticación completa.
4.  **Reportes Consolidados**:
    - Un job de cron que agrupe infracciones pendientes y envíe un solo correo resumen al administrador para evitar spam.

### **Requerimientos de Diseño (UI/UX)**
- Estética "Premium Dark Mode" con acentos esmeralda y azul.
- Dashboard responsivo (Mobile-First) que transforme tablas pesadas en tarjetas (Cards) en móviles.
- Uso de modales elegantes para formularios y visualización de detalles.
- Mapas interactivos con Leaflet para visualizar rutas y geocercas.

### **Instrucciones para la IA/Programador**
1.  Prioriza el **aislamiento de Tenants**. Ningún cliente debe ver datos de otro.
2.  Mantén el backend lo más desacoplado posible mediante servicios (`webhook.service.ts`, `infraction.service.ts`).
3.  Asegura que todas las multas se calculen con precisión decimal utilizando el tipo `Decimal` de Prisma/Postgres.
4.  Implementa el sistema de "Magic Links" para que los propietarios puedan acceder a sus datos de forma segura y sencilla.
