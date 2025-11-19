-- AlterTable: Add new feature-specific model columns
ALTER TABLE "user_preferences" ADD COLUMN "llmSummaryModel" TEXT;
ALTER TABLE "user_preferences" ADD COLUMN "llmEmbeddingModel" TEXT;
ALTER TABLE "user_preferences" ADD COLUMN "llmDigestModel" TEXT;

-- Data Migration: Copy existing llmModel data to llmSummaryModel
UPDATE "user_preferences" 
SET "llmSummaryModel" = "llmModel" 
WHERE "llmModel" IS NOT NULL;

-- Drop old column
ALTER TABLE "user_preferences" DROP COLUMN "llmModel";

