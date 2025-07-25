import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  root: 'frontend',
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'frontend/dist'),
    emptyOutDir: true,
    sourcemap: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'frontend/src'),
      '@assets': path.resolve(__dirname, 'attached_assets')
    }
  }
})