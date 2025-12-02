-- AlterTable: Change default value of autoMarkAsRead from false to true
ALTER TABLE "user_preferences" ALTER COLUMN "autoMarkAsRead" SET DEFAULT true;

-- Update existing records: Set autoMarkAsRead to true for users who have it as false
-- This ensures all users have the correct default value
UPDATE "user_preferences" SET "autoMarkAsRead" = true WHERE "autoMarkAsRead" = false;
