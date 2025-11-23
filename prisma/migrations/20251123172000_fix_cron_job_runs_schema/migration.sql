-- Fix cron_job_runs table schema to match Prisma schema
-- This migration adds missing columns and renames existing ones

-- Create enums if they don't exist
DO $$ BEGIN
    CREATE TYPE "CronJobTrigger" AS ENUM ('SCHEDULER', 'MANUAL', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CronJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns
ALTER TABLE "cron_job_runs" ADD COLUMN IF NOT EXISTS "triggeredBy" "CronJobTrigger" NOT NULL DEFAULT 'SYSTEM'::"CronJobTrigger";
ALTER TABLE "cron_job_runs" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "cron_job_runs" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "cron_job_runs" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Rename columns (only if old column exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cron_job_runs' AND column_name = 'duration') THEN
        ALTER TABLE "cron_job_runs" RENAME COLUMN "duration" TO "durationMs";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cron_job_runs' AND column_name = 'result') THEN
        ALTER TABLE "cron_job_runs" RENAME COLUMN "result" TO "stats";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cron_job_runs' AND column_name = 'error') THEN
        ALTER TABLE "cron_job_runs" RENAME COLUMN "error" TO "errorMessage";
    END IF;
END $$;

-- Update status column to use enum (if it's currently TEXT)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cron_job_runs' 
        AND column_name = 'status' 
        AND data_type = 'text'
    ) THEN
        -- Clean up any invalid values first
        UPDATE "cron_job_runs" 
        SET status = 'SUCCESS' 
        WHERE status NOT IN ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');
        
        -- Convert to enum
        ALTER TABLE "cron_job_runs" 
        ALTER COLUMN "status" TYPE "CronJobStatus" 
        USING (status::"CronJobStatus");
    END IF;
END $$;

-- Add missing index
CREATE INDEX IF NOT EXISTS "cron_job_runs_jobName_status_idx" ON "cron_job_runs"("jobName", "status");

