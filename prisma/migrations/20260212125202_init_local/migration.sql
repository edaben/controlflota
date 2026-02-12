-- DropForeignKey
ALTER TABLE "speed_zones" DROP CONSTRAINT "speed_zones_routeId_fkey";

-- AlterTable
ALTER TABLE "speed_zones" ADD COLUMN     "stopId" TEXT,
ALTER COLUMN "routeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "speed_zones" ADD CONSTRAINT "speed_zones_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speed_zones" ADD CONSTRAINT "speed_zones_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
