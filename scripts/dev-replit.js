#!/usr/bin/env node
/**
 * Development script for Replit environment
 * Starts Vite development server with Bun
 */

const { spawn } = require('child_process');

console.log('🚀 Starting Albergue Management System with Bun...');

// Start Vite dev server from frontend directory using bun
const viteProcess = spawn('bun', ['run', 'dev'], {
  cwd: './frontend',
  stdio: 'inherit',
  env: {
    ...process.env,
    HOST: '0.0.0.0',
    PORT: '5173'
  }
});

viteProcess.on('error', (error) => {
  console.error('Failed to start Vite server:', error);
  process.exit(1);
});

viteProcess.on('close', (code) => {
  console.log(`Vite server exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  viteProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  viteProcess.kill('SIGTERM');
});