import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
  // Set root to current directory but configure proper paths
  root: '.',
  
  plugins: [
    react(),
  ],

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    open: false,
  },

  resolve: {
    alias: {
      // Frontend source paths
      '@': path.resolve(__dirname, 'src'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
      '@shared': path.resolve(__dirname, 'services/shared/src'),
      '@wasm': path.resolve(__dirname, 'pkg'),
    },
  },

  optimizeDeps: {
    exclude: ['@wasm', 'wasm-services'],
    include: ['react', 'react-dom', '@tanstack/react-query']
  },

  css: {
    postcss: './postcss.config.js'
  },

  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('pkg/')) {
            return 'wasm-services'
          }
        }
      }
    }
  },

  define: {
    __API_BASE_URL__: JSON.stringify(
      mode === 'development'
        ? 'http://localhost:8000'
        : 'https://www.alberguedelcarrascalejo.com/reservas/api'
    )
  }
}))