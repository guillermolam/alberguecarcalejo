#!/usr/bin/env node
import { execSync } from "child_process";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Development script for Replit environment
console.log("🚀 Starting Albergue Management System...");

try {
  // Use vite with explicit config path to run from root but serve frontend
  execSync("npx vite --config frontend/vite.config.ts --host 0.0.0.0 --port 5173", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Failed to start development server:", error.message);
  process.exit(1);
}
