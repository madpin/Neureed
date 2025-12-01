-- CreateTable
CREATE TABLE IF NOT EXISTS "job_locks" (
    "jobName" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL,
    "lockedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_locks_pkey" PRIMARY KEY ("jobName")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "job_locks_expiresAt_idx" ON "job_locks"("expiresAt");
