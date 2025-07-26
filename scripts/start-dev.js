
#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';

console.log('🦀 Starting Spin WASM Microservices Architecture');
console.log('');
console.log('🔧 Starting services:');
console.log('  📊 Spin Gateway (port 8000) - All backend APIs');
console.log('  🎨 Vite Frontend (port 5173) - Static file serving');
console.log('');

// Start Spin gateway for all backend APIs
const spinProcess = spawn('spin', ['up', '--listen', '0.0.0.0:8000'], {
  stdio: 'inherit',
  cwd: './gateway'
});

// Start Vite dev server for frontend
const viteProcess = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5173'], {
  cwd: './frontend',
  stdio: 'inherit'
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down services...');
  spinProcess.kill('SIGINT');
  viteProcess.kill('SIGINT');
  setTimeout(() => process.exit(0), 1000);
});

process.on('SIGTERM', () => {
  spinProcess.kill('SIGTERM');
  viteProcess.kill('SIGTERM');
  setTimeout(() => process.exit(0), 1000);
});

// Monitor processes
spinProcess.on('close', (code) => {
  if (code !== 0) {
    console.log(`❌ Spin gateway exited with code ${code}`);
  }
});

viteProcess.on('close', (code) => {
  if (code !== 0) {
    console.log(`❌ Vite frontend exited with code ${code}`);
  }
});
