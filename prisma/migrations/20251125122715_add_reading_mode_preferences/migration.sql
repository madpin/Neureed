-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "inlineAutoScroll" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "readingMode" TEXT NOT NULL DEFAULT 'side_panel';
