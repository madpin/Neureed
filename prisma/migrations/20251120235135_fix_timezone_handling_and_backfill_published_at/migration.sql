-- Fix timezone handling by converting timestamp to timestamptz
-- This ensures proper timezone handling for feeds from different parts of the world

-- Step 1: Convert all timestamp columns to timestamptz for articles table
ALTER TABLE "articles"
  ALTER COLUMN "publishedAt" TYPE TIMESTAMPTZ USING "publishedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ USING "updatedAt" AT TIME ZONE 'UTC';

-- Step 2: Backfill NULL publishedAt values with createdAt
-- This ensures all articles have a publishedAt value for proper sorting
UPDATE "articles"
SET "publishedAt" = "createdAt"
WHERE "publishedAt" IS NULL;
