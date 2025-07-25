import { createServer } from 'vite';
import path from 'path';

async function startServer() {
  console.log('🚀 Starting Vite development server with WASM services...');
  
  const server = await createServer({
    root: './client',
    server: {
      port: 5000,
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
        '@wasm': path.resolve('./backend/services/pkg')
      }
    },
    optimizeDeps: {
      exclude: ['@wasm']
    }
  });

  await server.listen();
  server.printUrls();
  
  console.log('✅ Frontend server running with WASM services');
  console.log('📦 Build WASM services with: ./build-wasm.sh');
}

startServer().catch(console.error);