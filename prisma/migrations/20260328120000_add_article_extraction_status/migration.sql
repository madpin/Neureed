-- CreateEnum
CREATE TYPE "ArticleExtractionStatus" AS ENUM ('NONE', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "articles" ADD COLUMN "extractionStatus" "ArticleExtractionStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "articles" ADD COLUMN "extractionError" TEXT;
