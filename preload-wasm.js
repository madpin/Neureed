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

// 2. Pre-resolve onnxruntime-web path
let onnxWebPath = null;
try {
  // Resolve from current module's perspective
  onnxWebPath = require.resolve('onnxruntime-web');
  console.log('[Preload] Resolved onnxruntime-web to:', onnxWebPath);
} catch (e) {
  console.error('[Preload] Could not resolve onnxruntime-web:', e.message);
}

// 3. Redirect 'onnxruntime-node' imports to 'onnxruntime-web'
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === 'onnxruntime-node' || request.endsWith('/onnxruntime-node')) {
    console.log(`[Preload] Intercepted require('${request}')`);
    
    if (onnxWebPath) {
      console.log(`[Preload] Redirecting to onnxruntime-web at ${onnxWebPath}`);
      return onnxWebPath;
    } else {
      console.warn('[Preload] onnxruntime-web not available, attempting fallback resolution');
      try {
        // Try to resolve with proper parent handling
        if (parent && parent.filename) {
          return originalResolveFilename.call(this, 'onnxruntime-web', parent, isMain, options);
        } else {
          // If no parent, resolve from current working directory
          return originalResolveFilename.call(this, 'onnxruntime-web', 
            { id: '.', filename: path.join(process.cwd(), 'index.js'), paths: Module._nodeModulePaths(process.cwd()) },
            isMain, options);
        }
      } catch (e) {
        console.error('[Preload] Failed to redirect:', e.message);
        // Fall through to original resolution which will likely fail
      }
    }
  }
  return originalResolveFilename.apply(this, arguments);
};

// 4. Backup: Mock onnxruntime-node in cache if redirection fails
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
  // Try to mock by name in cache
  require.cache['onnxruntime-node'] = {
    id: 'onnxruntime-node',
    filename: 'mock-onnxruntime-node',
    loaded: true,
    exports: mockOnnxRuntime
  };
} catch (e) {
  console.error('[Preload] Error setting up cache mocks:', e);
}

console.log('[Preload] WASM enforcement complete. Native ONNX loading redirected/blocked.');
