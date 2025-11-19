-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "searchRecencyDecayDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "searchRecencyWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.3;
