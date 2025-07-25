#!/usr/bin/env node

// WASM Microservices Development Server for Replit
import { exec } from 'child_process';

console.log('🦀 Starting Rust WASM Microservices Architecture');
console.log('📦 Frontend-only server with WASM backend services');

// Start development server with proper port configuration
exec('tsx server/index.ts', { env: { ...process.env, PORT: '80' } }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  console.log(stdout);
  if (stderr) console.error(stderr);
});