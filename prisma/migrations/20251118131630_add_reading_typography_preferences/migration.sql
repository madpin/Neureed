-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "readingFontFamily" TEXT NOT NULL DEFAULT 'Georgia',
ADD COLUMN     "readingFontSize" INTEGER NOT NULL DEFAULT 18,
ADD COLUMN     "readingLineHeight" DOUBLE PRECISION NOT NULL DEFAULT 1.7,
ADD COLUMN     "readingParagraphSpacing" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
ADD COLUMN     "showReadingTime" BOOLEAN NOT NULL DEFAULT true;
