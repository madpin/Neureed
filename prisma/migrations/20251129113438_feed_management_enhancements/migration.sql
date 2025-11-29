-- Feed Management Enhancements Migration

-- 1. User Categories - Add hierarchical support and additional features
ALTER TABLE "user_categories"
  ADD COLUMN "parentId" TEXT,
  ADD COLUMN "color" TEXT,
  ADD COLUMN "collapsed" BOOLEAN DEFAULT false,
  ADD COLUMN "sortOrder" TEXT DEFAULT 'manual',
  ADD COLUMN "includeInSearch" BOOLEAN DEFAULT true,
  ADD COLUMN "isDefault" BOOLEAN DEFAULT false,
  ADD COLUMN "isReadOnly" BOOLEAN DEFAULT false;

-- Foreign key for hierarchy
ALTER TABLE "user_categories"
  ADD CONSTRAINT "user_categories_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "user_categories"("id")
  ON DELETE SET NULL;

-- Ensure only one default category per user
CREATE UNIQUE INDEX "user_categories_userId_isDefault_idx"
  ON "user_categories"("userId")
  WHERE "isDefault" = true;

-- 2. Feeds - Add health tracking
ALTER TABLE "feeds"
  ADD COLUMN "healthStatus" TEXT DEFAULT 'healthy',
  ADD COLUMN "consecutiveFailures" INT DEFAULT 0,
  ADD COLUMN "lastSuccessfulFetch" TIMESTAMP,
  ADD COLUMN "autoDisableThreshold" INT DEFAULT 10,
  ADD COLUMN "notifyOnError" BOOLEAN DEFAULT false,
  ADD COLUMN "httpStatus" INT,
  ADD COLUMN "redirectUrl" TEXT;

CREATE INDEX "feeds_healthStatus_idx" ON "feeds"("healthStatus");

-- 3. User Feeds - Add tags
ALTER TABLE "user_feeds"
  ADD COLUMN "tags" TEXT[];

CREATE INDEX "user_feeds_tags_idx" ON "user_feeds" USING gin("tags");

-- 4. Feed Error Log - New table for detailed error tracking
CREATE TABLE "feed_error_log" (
  "id" TEXT PRIMARY KEY,
  "feedId" TEXT NOT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  "errorType" TEXT NOT NULL,
  "errorMessage" TEXT NOT NULL,
  "httpStatus" INT,
  "details" JSONB,
  "resolved" BOOLEAN DEFAULT false,

  CONSTRAINT "feed_error_log_feedId_fkey"
    FOREIGN KEY ("feedId") REFERENCES "feeds"("id")
    ON DELETE CASCADE
);

-- Indexes for feed error log
CREATE INDEX "feed_error_log_feedId_idx" ON "feed_error_log"("feedId");
CREATE INDEX "feed_error_log_timestamp_idx" ON "feed_error_log"("timestamp" DESC);
CREATE INDEX "feed_error_log_resolved_idx" ON "feed_error_log"("resolved");
