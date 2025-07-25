#!/usr/bin/env node
/**
 * Production build script to fix ESBuild CommonJS format incompatibility
 * Addresses the deployment errors by using proper ESM format and external package exclusions
 */

import { build } from 'esbuild';
import { execSync } from 'child_process';

console.log('Building for production deployment...');

// Build client first
console.log('Building client assets...');
execSync('npm run build:client', { stdio: 'inherit' });

// Build server with ESM format and proper externals
console.log('Building server with ESM support...');
await build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm', // Fix: Use ESM format instead of CommonJS
  target: 'node18',
  outfile: 'dist/server.js',
  // Fix: Add external packages exclusion to resolve lightningcss issue
  external: [
    'lightningcss',
    '../pkg',
    'bufferutil',
    'utf-8-validate',
    'sqlite3',
    'pg-native'
  ],
  banner: {
    js: `
// Fix: Add CommonJS compatibility for bundled dependencies
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname } from "path";
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  mainFields: ['module', 'main'],
  conditions: ['import', 'module', 'default'],
  logLevel: 'info'
});

console.log('Production build completed successfully!');
console.log('Files created in dist/:');
console.log('  - server.js (ESM-compatible server bundle)');
console.log('  - public/ (optimized client assets)');