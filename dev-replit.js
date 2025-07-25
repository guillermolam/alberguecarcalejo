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

// Start Gateway proxy with route protection
const gatewayProcess = spawn("node", ["gateway-proxy.js"], {
  stdio: "inherit"
});

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
    gatewayProcess.kill();
    viteProcess.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    apiProcess.kill();
    gatewayProcess.kill();
    viteProcess.kill();
    process.exit(0);
  });
}, 1000);
