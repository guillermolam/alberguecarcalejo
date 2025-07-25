#!/usr/bin/env node
import { spawn } from "child_process";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Development script for Replit environment
console.log("🚀 Starting Albergue Management System...");

// Start the Vite development server for frontend
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
