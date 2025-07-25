import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  server: {
    port: 5173,
    host: '0.0.0.0',
    open: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, '../tests/attached_assets'),
      '@shared': path.resolve(__dirname, '../services/shared'),
      '@wasm': path.resolve(__dirname, '../services')
    }
  },
  optimizeDeps: {
    exclude: ['@wasm', 'wasm-services']
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
})