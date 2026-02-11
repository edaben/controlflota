-- AlterTable
ALTER TABLE "stops" ADD COLUMN "geofenceCoordinates" JSONB,
ADD COLUMN "geofenceRadius" DOUBLE PRECISION,
ADD COLUMN "geofenceType" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "name" TEXT,
ADD COLUMN "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "phone" TEXT;
