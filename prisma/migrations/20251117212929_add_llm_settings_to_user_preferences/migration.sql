-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "llmApiKey" TEXT,
ADD COLUMN     "llmBaseUrl" TEXT,
ADD COLUMN     "llmModel" TEXT,
ADD COLUMN     "llmProvider" TEXT;
