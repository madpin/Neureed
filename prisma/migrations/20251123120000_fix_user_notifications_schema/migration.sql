-- Fix missing columns in user_notifications table
-- Using IF NOT EXISTS to be safe against partial states

ALTER TABLE "user_notifications" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "user_notifications" ADD COLUMN IF NOT EXISTS "read" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_notifications" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'info';
ALTER TABLE "user_notifications" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "user_notifications" ADD COLUMN IF NOT EXISTS "message" TEXT NOT NULL DEFAULT '';

-- For updatedAt, we need a default to backfill existing rows
ALTER TABLE "user_notifications" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- For createdAt
ALTER TABLE "user_notifications" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Ensure indices exist
CREATE INDEX IF NOT EXISTS "user_notifications_userId_createdAt_idx" ON "user_notifications"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "user_notifications_userId_read_idx" ON "user_notifications"("userId", "read");

