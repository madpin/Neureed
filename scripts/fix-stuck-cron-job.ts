/**
 * Fix stuck cron job runs
 * 
 * This script marks any cron jobs that are stuck in "RUNNING" status
 * as "FAILED" so they don't block future runs.
 * 
 * Usage: npx tsx scripts/fix-stuck-cron-job.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking for stuck cron job runs...\n");

  // Find all jobs that have been running for more than 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const stuckJobs = await prisma.cronJobRun.findMany({
    where: {
      status: "RUNNING",
      startedAt: {
        lt: tenMinutesAgo,
      },
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  if (stuckJobs.length === 0) {
    console.log("✅ No stuck jobs found");
    return;
  }

  console.log(`Found ${stuckJobs.length} stuck job(s):\n`);

  for (const job of stuckJobs) {
    const duration = Date.now() - job.startedAt.getTime();
    const minutesStuck = Math.floor(duration / 60000);

    console.log(`Job: ${job.jobName}`);
    console.log(`  ID: ${job.id}`);
    console.log(`  Started: ${job.startedAt.toISOString()}`);
    console.log(`  Running for: ${minutesStuck} minutes`);
    console.log(`  Triggered by: ${job.triggeredBy}`);
    console.log();
  }

  console.log("Marking stuck jobs as FAILED...\n");

  const result = await prisma.cronJobRun.updateMany({
    where: {
      status: "RUNNING",
      startedAt: {
        lt: tenMinutesAgo,
      },
    },
    data: {
      status: "FAILED",
      completedAt: new Date(),
      errorMessage: "Job timed out - marked as failed by cleanup script",
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Marked ${result.count} job(s) as FAILED`);
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

