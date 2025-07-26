#!/usr/bin/env node
import { spawn } from "child_process";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Development script for Replit environment
console.log("🚀 Starting Albergue Management System...");

// Start the API server first
const apiProcess = spawn("node", ["api-server.js"], {
  stdio: "inherit"
});

// BFF Gateway Services (Rust microservices ready)
console.log('🛡️  BFF Gateway Architecture:');
console.log('🔒 Security Service: /api/security/* (Rust WASM)');
console.log('⏱️  Rate Limiter: /api/rate-limit/* (Rust WASM)'); 
console.log('🔐 Auth Verify: /api/auth/* (Rust WASM)');
console.log('📋 Booking Service: /api/booking/* (Rust WASM)');
console.log('⭐ Reviews Service: /api/reviews/* (Rust WASM)');

// Wait a moment then start Vite
setTimeout(() => {
  const viteProcess = spawn("npx", ["vite", "--host", "0.0.0.0", "--port", "5173"], {
    cwd: "frontend",
    stdio: "inherit"
  });

  // Handle process cleanup
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    apiProcess.kill();
    viteProcess.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    apiProcess.kill();
    viteProcess.kill();
    process.exit(0);
  });
}, 1000);
