// Pure Frontend Server - WASM Services Architecture
// This serves only static files, all backend logic runs in WASM
import { createServer } from 'vite';
import path from 'path';

async function startServer() {
  console.log('🦀 Starting Rust WASM Microservices Architecture');
  console.log('📦 Frontend-only server with WASM backend services');
  
  const server = await createServer({
    root: './client',
    server: {
      port: parseInt(process.env.PORT || '80'),
      host: '0.0.0.0',
      open: false
    },
    define: {
      'process.env.NODE_ENV': '"development"'
    },
    resolve: {
      alias: {
        '@': path.resolve('./client/src'),
        '@assets': path.resolve('./attached_assets'),
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
  console.log('🔧 Build WASM: ./scripts/cargo-build.sh');
  console.log('🚀 All backend logic runs in browser WASM');
}

startServer().catch(console.error);