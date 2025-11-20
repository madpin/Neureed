/**
 * Preload script to force WASM backend for @xenova/transformers
 * This runs BEFORE any application code, ensuring environment variables
 * are set before the transformers library is imported.
 * 
 * Usage: node --require ./preload-wasm.js server.js
 */

const Module = require('module');
const path = require('path');

console.log('[Preload] Initializing WASM enforcement...');

// 1. Force WASM backend environment variables
process.env.TRANSFORMERS_BACKEND = 'wasm';
process.env.ONNXRUNTIME_EXECUTION_PROVIDERS = 'wasm';
process.env.USE_ONNX_WASM = '1';
process.env.TRANSFORMERS_CACHE = process.env.TRANSFORMERS_CACHE || './.cache/transformers';

console.log('[Preload] Environment variables set:');
console.log('  TRANSFORMERS_BACKEND:', process.env.TRANSFORMERS_BACKEND);

// 2. Redirect 'onnxruntime-node' imports to 'onnxruntime-web'
// This forces the library to use the Web/WASM version instead of the Native one
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === 'onnxruntime-node' || request.endsWith('/onnxruntime-node')) {
    console.log(`[Preload] Redirecting require('${request}') to 'onnxruntime-web'`);
    try {
      // Try to resolve onnxruntime-web instead
      return originalResolveFilename.call(this, 'onnxruntime-web', parent, isMain, options);
    } catch (e) {
      console.warn('[Preload] Failed to redirect to onnxruntime-web (not found?), falling back to mock');
      // If web version is missing, fall through to original (which might fail or load native)
      // But we have a backup mock in require.cache below
    }
  }
  return originalResolveFilename.apply(this, arguments);
};

// 3. Backup: Mock onnxruntime-node in cache if redirection fails
// This ensures we never load the native binary
const mockOnnxRuntime = {
  backend: { name: 'wasm-mock' },
  env: { wasm: {} },
  InferenceSession: {
    create: async () => {
      throw new Error("Native ONNX Runtime is disabled. Please ensure onnxruntime-web is installed.");
    }
  },
  Tensor: class MockTensor { constructor() {} }
};

try {
  // Try to mock by name
  require.cache['onnxruntime-node'] = {
    id: 'onnxruntime-node',
    filename: 'mock-onnxruntime-node',
    loaded: true,
    exports: mockOnnxRuntime
  };
  
  // Also try to mock by path if resolvable
  try {
    const pkgPath = require.resolve('onnxruntime-node');
    require.cache[pkgPath] = {
      id: pkgPath,
      filename: pkgPath,
      loaded: true,
      exports: mockOnnxRuntime
    };
  } catch (e) {
    // Expected if module is missing or redirected
  }
} catch (e) {
  console.error('[Preload] Error setting up cache mocks:', e);
}

console.log('[Preload] WASM enforcement complete. Native ONNX loading redirected/blocked.');
