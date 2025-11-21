-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN "articleCardBorderWidth" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN "articleCardBorderRadius" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN "articleCardBorderContrast" TEXT NOT NULL DEFAULT 'medium';

