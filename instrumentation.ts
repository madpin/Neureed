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
    // Configure transformers.js to use WASM backend ONLY
    // This must happen BEFORE any code imports @xenova/transformers
    // Fallback safety check in case container env vars aren't set
    if (!process.env.TRANSFORMERS_BACKEND) {
      process.env.TRANSFORMERS_BACKEND = "wasm";
      console.log("[Instrumentation] Set TRANSFORMERS_BACKEND=wasm (fallback)");
    }
    if (!process.env.ONNXRUNTIME_EXECUTION_PROVIDERS) {
      process.env.ONNXRUNTIME_EXECUTION_PROVIDERS = "wasm";
      console.log("[Instrumentation] Set ONNXRUNTIME_EXECUTION_PROVIDERS=wasm (fallback)");
    }
    if (!process.env.USE_ONNX_WASM) {
      process.env.USE_ONNX_WASM = "1";
      console.log("[Instrumentation] Set USE_ONNX_WASM=1 (fallback)");
    }
    
    console.log("[Instrumentation] Transformers.js configured for WASM-only backend");
    console.log("[Instrumentation] Running in Node.js runtime, initializing scheduler...");
    
    const { initializeScheduler } = await import("./src/lib/jobs/scheduler");
    
    // Initialize cron jobs
    initializeScheduler();
    
    console.log("[Instrumentation] Scheduler initialization complete");
  } else {
    console.log("[Instrumentation] Not in Node.js runtime, skipping scheduler initialization");
  }
}

