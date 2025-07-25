#!/usr/bin/env node

// Development server for WASM microservices architecture
console.log("🦀 Starting Rust WASM Microservices Development Server");
console.log("📦 Frontend + WASM backend services architecture");
console.log("✅ Legacy backend/ folder completely removed");
console.log("🔧 All microservices under services/ with DDD structure");

// Import required modules
const { spawn } = require('child_process');
const path = require('path');

// Set environment variables
process.env.PORT = "5173";
process.env.NODE_ENV = "development";

// Function to run a command
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

// Main execution
async function main() {
  try {
    // Start the development server directly
    console.log("🚀 Starting server on port 5173...");
    
    // Use tsx to run the frontend server
    await runCommand('npx', ['tsx', 'frontend/server/index.ts']);
  } catch (error) {
    console.error('Failed to start development server:', error.message);
    process.exit(1);
  }
}

main();