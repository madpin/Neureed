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
console.log('  ONNXRUNTIME_EXECUTION_PROVIDERS:', process.env.ONNXRUNTIME_EXECUTION_PROVIDERS);

// 2. Create a Mock for onnxruntime-node
// This prevents the native library from loading its .so/.dll files
const mockOnnxRuntime = {
  // Minimal API surface to satisfy imports without crashing immediately
  // but failing if used (forcing fallback or error we can control)
  backend: { name: 'wasm-mock' },
  env: { wasm: {} },
  InferenceSession: {
    create: async () => {
      console.warn('[Preload] Warning: Attempted to use native InferenceSession via mock');
      throw new Error("Native ONNX Runtime is disabled in this environment. Use WASM backend.");
    }
  },
  Tensor: class MockTensor { constructor() {} }
};

// 3. Attempt to pre-populate require cache
// This is the most robust way to mock if we can find the module
try {
  // Try to find where onnxruntime-node is installed
  // It might be nested in @xenova/transformers/node_modules
  const possiblePaths = [
    'onnxruntime-node',
    '@xenova/transformers/node_modules/onnxruntime-node'
  ];

  let resolved = false;
  for (const pkg of possiblePaths) {
    try {
      const pkgPath = require.resolve(pkg);
      require.cache[pkgPath] = {
        id: pkgPath,
        filename: pkgPath,
        loaded: true,
        exports: mockOnnxRuntime
      };
      console.log(`[Preload] Successfully mocked ${pkg} at ${pkgPath}`);
      resolved = true;
    } catch (e) {
      // Ignore resolution errors
    }
  }
} catch (e) {
  console.error('[Preload] Error during cache population:', e);
}

// 4. Intercept Module.prototype.require as a fallback
// This catches 'require("onnxruntime-node")' calls that verify the name string
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (typeof id === 'string' && (id === 'onnxruntime-node' || id.endsWith('/onnxruntime-node'))) {
    console.log(`[Preload] Intercepted require('${id}') -> returning mock`);
    return mockOnnxRuntime;
  }
  return originalRequire.apply(this, arguments);
};

console.log('[Preload] WASM enforcement complete. Native ONNX loading should be blocked.');
