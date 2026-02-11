-- AlterTable
ALTER TABLE "segment_rules" ADD COLUMN     "penaltyPerMinuteUsd" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "speed_zones" ADD COLUMN     "penaltyPerKmhUsd" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "stop_rules" ADD COLUMN     "minDwellTimeMinutes" INTEGER,
ADD COLUMN     "penaltyPerMinuteUsd" DECIMAL(10,2) NOT NULL DEFAULT 0;
