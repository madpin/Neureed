/**
 * Preload script to force WASM backend for @xenova/transformers
 * This runs BEFORE any application code, ensuring environment variables
 * are set before the transformers library is imported.
 * 
 * Usage: node --require ./preload-wasm.js server.js
 */

// Force WASM backend environment variables
process.env.TRANSFORMERS_BACKEND = 'wasm';
process.env.ONNXRUNTIME_EXECUTION_PROVIDERS = 'wasm';
process.env.USE_ONNX_WASM = '1';
process.env.TRANSFORMERS_CACHE = process.env.TRANSFORMERS_CACHE || './.cache/transformers';

console.log('[Preload] Forced WASM backend configuration:');
console.log('[Preload] TRANSFORMERS_BACKEND:', process.env.TRANSFORMERS_BACKEND);
console.log('[Preload] ONNXRUNTIME_EXECUTION_PROVIDERS:', process.env.ONNXRUNTIME_EXECUTION_PROVIDERS);
console.log('[Preload] USE_ONNX_WASM:', process.env.USE_ONNX_WASM);
console.log('[Preload] TRANSFORMERS_CACHE:', process.env.TRANSFORMERS_CACHE);

