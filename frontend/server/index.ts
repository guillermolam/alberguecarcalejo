// Pure Frontend Server - WASM Services Architecture
// This serves only static files, all backend logic runs in WASM
import { createServer } from 'vite';
import path from 'path';

async function startServer() {
  console.log('🦀 Starting Rust WASM Microservices Architecture');
  console.log('📦 Frontend-only server with WASM backend services');
  
  const server = await createServer({
    root: './frontend',
    server: {
      port: parseInt(process.env.PORT || '5173'),
      host: '0.0.0.0',
      open: false
    },
    define: {
      'process.env.NODE_ENV': '"development"'
    },
    resolve: {
      alias: {
        '@': path.resolve('./frontend/src'),
        '@assets': path.resolve('./tests/attached_assets'),
        '@shared': path.resolve('./shared'),
        '@wasm': path.resolve('./services')
      }
    },
    optimizeDeps: {
      exclude: ['@wasm', 'wasm-services']
    }
  });

  await server.listen();
  server.printUrls();
  
  console.log('✅ WASM microservices architecture active');
  console.log('🔧 Build WASM: bash scripts/build-wasm.sh');
  console.log('🚀 All backend logic runs in browser WASM');
}

startServer().catch(console.error);