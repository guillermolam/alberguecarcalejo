import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => ({
  // Root directory for serving (current frontend directory)
  root: '.',

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
    },
    // Proxy API calls to development server
    proxy: {
      '/booking': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
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
      '@': path.resolve(__dirname, 'src'),
      // Test and training assets
      '@assets': path.resolve(__dirname, '../attached_assets'),
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
    postcss: './postcss.config.js'
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: mode === 'development'
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