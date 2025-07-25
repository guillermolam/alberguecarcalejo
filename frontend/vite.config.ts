import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => ({
  // Root is the frontend folder
  root: path.resolve(__dirname),

  plugins: [
    react(),
  ],

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    open: false,
    // Allow only Replit dev hosts in development, and your real domain in production
    allowedHosts:
      mode === 'development'
        ? ['.replit.dev']
        : ['www.alberguedelcarrascalejo.com'],
    // Ignore heavy service build artifacts in watch mode
    watch: {
      ignored: ['**/services/**/target/**', '**/pkg/**']
    }
  },

  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts:
      mode === 'development'
        ? ['.replit.dev']
        : ['www.alberguedelcarrascalejo.com'],
  },

  resolve: {
    alias: {
      // Frontend source
      '@': path.resolve(__dirname, './src'),
      // Test and training assets
      '@assets': path.resolve(__dirname, '../tests/attached_assets'),
      // Shared Rust DTOs & types exposed to JS via wasm-bindgen or similar
      '@shared': path.resolve(__dirname, '../services/shared/src'),
      // All WASM service outputs
      '@wasm': path.resolve(__dirname, '../pkg'),
    },
  },

  optimizeDeps: {
    // Exclude all wasm-bindgen output directories
    exclude: ['@wasm', 'wasm-services'],
    // Pre-bundle frequently used modules to speed up cold start
    include: ['react', 'react-dom', '@tanstack/react-query']
  },

  css: {
    postcss: path.resolve(__dirname, './postcss.config.js')
  },

  build: {
    outDir: path.resolve(__dirname, '../dist'),
    emptyOutDir: true,
    sourcemap: mode === 'development',
    rollupOptions: {
      // Code splitting for WASM services if needed
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
    // Expose env var for API base
    __API_BASE_URL__: JSON.stringify(
      mode === 'development'
        ? 'http://localhost:8000'
        : 'https://www.alberguedelcarrascalejo.com/reservas/api'
    )
  }
}))