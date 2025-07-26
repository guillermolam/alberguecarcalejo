
#!/usr/bin/env node

console.log('🦀 Starting Pure WASM Microservices Architecture');
console.log('🚀 Spin Gateway (standalone): http://localhost:8000');
console.log('📊 All API endpoints served by Rust WASM services');
console.log('💡 Frontend served by Vite dev server');

import { spawn } from 'child_process';
import path from 'path';

// Start Vite dev server for frontend only
const viteProcess = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5173'], {
  cwd: path.join(process.cwd(), 'frontend'),
  stdio: 'inherit'
});

// Handle process cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down services...');
  viteProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  viteProcess.kill('SIGTERM');
  process.exit(0);
});

viteProcess.on('close', (code) => {
  console.log(`Vite process exited with code ${code}`);
  process.exit(code);
});
