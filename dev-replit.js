#!/usr/bin/env node
import { spawn } from "child_process";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Development script for Replit environment
console.log("🚀 Starting Albergue Management System...");

// BFF Gateway Services (Standalone Rust WASM)
console.log('🛡️  Standalone Spin Gateway Architecture:');
console.log('🔒 Security Service: /api/security/* (Rust WASM)');
console.log('⏱️  Rate Limiter: /api/rate-limit/* (Rust WASM)'); 
console.log('🔐 Auth Verify: /api/auth/* (Rust WASM)');
console.log('📋 Booking Service: /api/booking/* (Rust WASM)');
console.log('⭐ Reviews Service: /api/reviews/* (Rust WASM)');
console.log('🚀 Spin Gateway (standalone): http://localhost:8000');
console.log('📊 Admin API: /api/booking/admin/stats');
console.log('💰 Pricing API: /api/booking/pricing');

// Start Vite frontend development server
const viteProcess = spawn("npx", ["vite", "--host", "0.0.0.0", "--port", "5173"], {
  cwd: "frontend",
  stdio: "inherit"
});

// Handle process cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  viteProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  viteProcess.kill();
  process.exit(0);
});
