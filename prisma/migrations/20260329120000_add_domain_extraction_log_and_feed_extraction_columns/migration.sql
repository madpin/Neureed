-- Domain extraction rate limiting (per-domain log) and per-feed extraction tuning.
-- Aligns migration history with schema.prisma (was previously applied via drift / db push).

-- CreateTable
CREATE TABLE "domain_extraction_log" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "lastExtractedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "crawlDelay" INTEGER,
    "rateLimitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_extraction_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "domain_extraction_log_domain_key" ON "domain_extraction_log"("domain");

-- CreateIndex
CREATE INDEX "domain_extraction_log_domain_idx" ON "domain_extraction_log"("domain");

-- CreateIndex
CREATE INDEX "domain_extraction_log_lastExtractedAt_idx" ON "domain_extraction_log"("lastExtractedAt");

-- AlterTable
ALTER TABLE "feeds" ADD COLUMN "extractionDelayMs" INTEGER;
ALTER TABLE "feeds" ADD COLUMN "respectRobotsTxt" BOOLEAN DEFAULT true;
ALTER TABLE "feeds" ADD COLUMN "lastExtractionAt" TIMESTAMP(6);
