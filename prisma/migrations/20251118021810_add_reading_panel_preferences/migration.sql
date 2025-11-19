-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "readingPanelEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readingPanelPosition" TEXT NOT NULL DEFAULT 'right',
ADD COLUMN     "readingPanelSize" INTEGER NOT NULL DEFAULT 50;
