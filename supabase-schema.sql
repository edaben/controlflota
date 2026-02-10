-- Control Bus - Schema SQL para Supabase
-- Ejecutar este script completo en el SQL Editor de Supabase

-- Tabla: tenants
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    "apiKey" TEXT UNIQUE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'CLIENT_USER',
    "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    "traccarDeviceId" INTEGER UNIQUE NOT NULL,
    plate TEXT NOT NULL,
    "internalCode" TEXT,
    "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: routes
CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: stops
CREATE TABLE IF NOT EXISTS stops (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "traccarGeofenceId" INTEGER UNIQUE NOT NULL,
    "routeId" TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    "orderIndex" INTEGER NOT NULL,
    "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: segment_rules
CREATE TABLE IF NOT EXISTS segment_rules (
    id TEXT PRIMARY KEY,
    "fromStopId" TEXT NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
    "toStopId" TEXT NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
    "maxMinutes" INTEGER NOT NULL,
    "fineAmountUsd" DOUBLE PRECISION NOT NULL,
    "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: stop_rules
CREATE TABLE IF NOT EXISTS stop_rules (
    id TEXT PRIMARY KEY,
    "stopId" TEXT NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
    "maxDwellMinutes" INTEGER NOT NULL,
    "fineAmountUsd" DOUBLE PRECISION NOT NULL,
    "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: speed_zones
CREATE TABLE IF NOT EXISTS speed_zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "traccarGeofenceId" INTEGER UNIQUE NOT NULL,
    "maxSpeedKmh" INTEGER NOT NULL,
    "fineAmountUsd" DOUBLE PRECISION NOT NULL,
    "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: traccar_events
CREATE TABLE IF NOT EXISTS traccar_events (
    id TEXT PRIMARY KEY,
    "rawPayload" JSONB NOT NULL,
    "eventType" TEXT NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "eventTime" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: infractions
CREATE TABLE IF NOT EXISTS infractions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    description TEXT NOT NULL,
    "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: fines
CREATE TABLE IF NOT EXISTS fines (
    id TEXT PRIMARY KEY,
    "infractionId" TEXT NOT NULL REFERENCES infractions(id) ON DELETE CASCADE,
    "amountUsd" DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    "pdfUrl" TEXT,
    "shareToken" TEXT UNIQUE,
    "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: report_schedules
CREATE TABLE IF NOT EXISTS report_schedules (
    id TEXT PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT true,
    frequency TEXT NOT NULL,
    "everyNDays" INTEGER,
    "sendTimeLocal" TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'America/Guayaquil',
    "recipientsEmails" TEXT NOT NULL,
    "includeStatus" TEXT NOT NULL DEFAULT 'CONFIRMED_ONLY',
    "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: consolidated_reports
CREATE TABLE IF NOT EXISTS consolidated_reports (
    id TEXT PRIMARY KEY,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalUsd" DOUBLE PRECISION NOT NULL,
    "pdfUrl" TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: consolidated_report_items
CREATE TABLE IF NOT EXISTS consolidated_report_items (
    id TEXT PRIMARY KEY,
    "reportId" TEXT NOT NULL REFERENCES consolidated_reports(id) ON DELETE CASCADE,
    "fineId" TEXT NOT NULL REFERENCES fines(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: email_logs
CREATE TABLE IF NOT EXISTS email_logs (
    id TEXT PRIMARY KEY,
    "recipientEmail" TEXT NOT NULL,
    subject TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL,
    "errorMessage" TEXT,
    "tenantId" TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users("tenantId");
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant ON vehicles("tenantId");
CREATE INDEX IF NOT EXISTS idx_routes_tenant ON routes("tenantId");
CREATE INDEX IF NOT EXISTS idx_stops_tenant ON stops("tenantId");
CREATE INDEX IF NOT EXISTS idx_infractions_tenant ON infractions("tenantId");
CREATE INDEX IF NOT EXISTS idx_fines_tenant ON fines("tenantId");
CREATE INDEX IF NOT EXISTS idx_traccar_events_tenant ON traccar_events("tenantId");

-- Datos iniciales: Tenant Demo
INSERT INTO tenants (id, name, slug, "apiKey", active)
VALUES ('demo-tenant-id', 'Empresa Demo', 'demo', 'demo-api-key-12345', true)
ON CONFLICT (slug) DO NOTHING;

-- Datos iniciales: Usuario Super Admin
-- Password: admin123 (hasheado con bcrypt)
INSERT INTO users (id, email, password, role, "tenantId")
VALUES (
    'admin-user-id',
    'admin@demo.com',
    '$2b$10$rOvHPZYQqZqZqZqZqZqZqOeKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
    'SUPER_ADMIN',
    'demo-tenant-id'
)
ON CONFLICT (email) DO NOTHING;

-- Mensaje de confirmación
SELECT 'Base de datos creada exitosamente! 🎉' as mensaje;
