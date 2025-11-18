/**
 * Next.js Instrumentation Hook
 * This file is executed once when the server starts
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  console.log("[Instrumentation] register() called");
  console.log("[Instrumentation] NEXT_RUNTIME:", process.env.NEXT_RUNTIME);
  
  // Only run on server
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[Instrumentation] Running in Node.js runtime, initializing scheduler...");
    
    const { initializeScheduler } = await import("./src/lib/jobs/scheduler");
    
    // Initialize cron jobs
    initializeScheduler();
    
    console.log("[Instrumentation] Scheduler initialization complete");
  } else {
    console.log("[Instrumentation] Not in Node.js runtime, skipping scheduler initialization");
  }
}

