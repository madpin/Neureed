-- DropIndex
DROP INDEX "cron_job_runs_jobName_idx";

-- DropIndex
DROP INDEX "cron_job_runs_jobName_startedAt_idx";

-- DropIndex
DROP INDEX "cron_job_runs_startedAt_idx";

-- AlterTable
ALTER TABLE "accounts" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "cron_job_runs" ALTER COLUMN "triggeredBy" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "cardFontSize" TEXT NOT NULL DEFAULT 'same',
ADD COLUMN     "modalFontSize" TEXT NOT NULL DEFAULT 'same',
ADD COLUMN     "sidebarFontSize" TEXT NOT NULL DEFAULT 'smaller',
ADD COLUMN     "uiFontSize" TEXT NOT NULL DEFAULT 'same';

-- CreateIndex
CREATE INDEX "cron_job_runs_jobName_startedAt_idx" ON "cron_job_runs"("jobName", "startedAt");
