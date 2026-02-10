-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'CLIENT_ADMIN', 'CLIENT_USER');

-- CreateEnum
CREATE TYPE "InfractionType" AS ENUM ('TIME_SEGMENT', 'DWELL_TIME', 'OVERSPEED');

-- CreateEnum
CREATE TYPE "InfractionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'EVERY_N_DAYS', 'EVERY_24_HOURS');

-- CreateEnum
CREATE TYPE "IncludeStatus" AS ENUM ('CONFIRMED_ONLY', 'PENDING_AND_CONFIRMED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('GENERATED', 'SENT', 'ERROR');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "smtpHost" TEXT,
    "smtpPort" INTEGER DEFAULT 587,
    "smtpUser" TEXT,
    "smtpPassword" TEXT,
    "smtpFromEmail" TEXT,
    "smtpFromName" TEXT,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENT_USER',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "traccarDeviceId" INTEGER,
    "internalCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stops" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "geofenceId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segment_rules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "fromStopId" TEXT NOT NULL,
    "toStopId" TEXT NOT NULL,
    "expectedMinMinutes" INTEGER,
    "expectedMaxMinutes" INTEGER NOT NULL,
    "fineAmountUsd" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "segment_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stop_rules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "maxDwellMinutes" INTEGER NOT NULL,
    "fineAmountUsd" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "stop_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speed_zones" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "geofenceId" TEXT,
    "maxSpeedKmh" INTEGER NOT NULL,
    "fineAmountUsd" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "speed_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gps_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gps_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stop_arrivals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "arrivedAt" TIMESTAMP(3) NOT NULL,
    "departedAt" TIMESTAMP(3),
    "dwellMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stop_arrivals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infractions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" "InfractionType" NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "status" "InfractionStatus" NOT NULL DEFAULT 'PENDING',
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "infractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fines" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "infractionId" TEXT NOT NULL,
    "amountUsd" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fineId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "pdfPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_schedules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "frequency" "Frequency" NOT NULL DEFAULT 'DAILY',
    "everyNDays" INTEGER,
    "sendTimeLocal" TEXT NOT NULL DEFAULT '23:59',
    "timezone" TEXT NOT NULL DEFAULT 'America/Guayaquil',
    "includeStatus" "IncludeStatus" NOT NULL DEFAULT 'CONFIRMED_ONLY',
    "recipientsEmails" TEXT[],

    CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consolidated_reports" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalUsd" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "pdfPath" TEXT,
    "shareToken" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'GENERATED',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consolidated_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consolidated_report_items" (
    "id" TEXT NOT NULL,
    "consolidatedReportId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "infractionId" TEXT NOT NULL,
    "fineId" TEXT NOT NULL,
    "amountUsd" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "consolidated_report_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "relatedReportId" TEXT,
    "relatedTicketId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_apiKey_key" ON "tenants"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_traccarDeviceId_key" ON "vehicles"("traccarDeviceId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_tenantId_plate_key" ON "vehicles"("tenantId", "plate");

-- CreateIndex
CREATE UNIQUE INDEX "fines_infractionId_key" ON "fines"("infractionId");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_fineId_key" ON "tickets"("fineId");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_shareToken_key" ON "tickets"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "report_schedules_tenantId_key" ON "report_schedules"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "consolidated_reports_shareToken_key" ON "consolidated_reports"("shareToken");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stops" ADD CONSTRAINT "stops_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stops" ADD CONSTRAINT "stops_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segment_rules" ADD CONSTRAINT "segment_rules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segment_rules" ADD CONSTRAINT "segment_rules_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segment_rules" ADD CONSTRAINT "segment_rules_fromStopId_fkey" FOREIGN KEY ("fromStopId") REFERENCES "stops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "segment_rules" ADD CONSTRAINT "segment_rules_toStopId_fkey" FOREIGN KEY ("toStopId") REFERENCES "stops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_rules" ADD CONSTRAINT "stop_rules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_rules" ADD CONSTRAINT "stop_rules_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "stops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speed_zones" ADD CONSTRAINT "speed_zones_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speed_zones" ADD CONSTRAINT "speed_zones_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gps_events" ADD CONSTRAINT "gps_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_arrivals" ADD CONSTRAINT "stop_arrivals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_arrivals" ADD CONSTRAINT "stop_arrivals_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_arrivals" ADD CONSTRAINT "stop_arrivals_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "stops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infractions" ADD CONSTRAINT "infractions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infractions" ADD CONSTRAINT "infractions_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fines" ADD CONSTRAINT "fines_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fines" ADD CONSTRAINT "fines_infractionId_fkey" FOREIGN KEY ("infractionId") REFERENCES "infractions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_fineId_fkey" FOREIGN KEY ("fineId") REFERENCES "fines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consolidated_reports" ADD CONSTRAINT "consolidated_reports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consolidated_report_items" ADD CONSTRAINT "consolidated_report_items_consolidatedReportId_fkey" FOREIGN KEY ("consolidatedReportId") REFERENCES "consolidated_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_relatedReportId_fkey" FOREIGN KEY ("relatedReportId") REFERENCES "consolidated_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
