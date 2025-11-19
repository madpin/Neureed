-- DropIndex
DROP INDEX "articles_embedding_idx";

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "author" TEXT,
ADD COLUMN     "contentHash" TEXT,
ADD COLUMN     "excerpt" TEXT,
ADD COLUMN     "guid" TEXT,
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "feeds" ADD COLUMN     "description" TEXT,
ADD COLUMN     "errorCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "etag" TEXT,
ADD COLUMN     "fetchInterval" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "lastModified" TEXT,
ADD COLUMN     "siteUrl" TEXT;

-- CreateIndex
CREATE INDEX "articles_feedId_publishedAt_idx" ON "articles"("feedId", "publishedAt");

-- CreateIndex
CREATE INDEX "articles_guid_idx" ON "articles"("guid");

-- CreateIndex
CREATE INDEX "articles_contentHash_idx" ON "articles"("contentHash");

-- CreateIndex
CREATE INDEX "feeds_lastFetched_idx" ON "feeds"("lastFetched");

-- CreateIndex
CREATE INDEX "feeds_errorCount_idx" ON "feeds"("errorCount");
