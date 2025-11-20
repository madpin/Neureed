-- CreateTable
CREATE TABLE "cron_job_runs" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "result" JSONB,
    "error" TEXT,

    CONSTRAINT "cron_job_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cron_job_runs_jobName_idx" ON "cron_job_runs"("jobName");

-- CreateIndex
CREATE INDEX "cron_job_runs_startedAt_idx" ON "cron_job_runs"("startedAt");

-- CreateIndex
CREATE INDEX "cron_job_runs_jobName_startedAt_idx" ON "cron_job_runs"("jobName", "startedAt" DESC);

