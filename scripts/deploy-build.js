#!/usr/bin/env node

import { build } from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting deployment build process...');

// Clean dist directory
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist', { recursive: true });

console.log('📦 Building client assets...');
try {
  execSync('npm run build:client', { stdio: 'inherit' });
  console.log('✅ Client build completed');
} catch (error) {
  console.error('❌ Client build failed:', error.message);
  process.exit(1);
}

console.log('🔧 Building server with ESM support...');
try {
  await build({
    entryPoints: ['server/index.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    outfile: 'dist/server.js',
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
    minify: true,
    sourcemap: true,
    logLevel: 'info',
    metafile: true
  }).then(result => {
    if (result.metafile) {
      fs.writeFileSync('dist/meta.json', JSON.stringify(result.metafile, null, 2));
    }
  });
  
  console.log('✅ Server build completed');
} catch (error) {
  console.error('❌ Server build failed:', error);
  process.exit(1);
}

// Create production package.json
const productionPkg = {
  "name": "rest-express",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "NODE_ENV=production node server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
};

fs.writeFileSync('dist/package.json', JSON.stringify(productionPkg, null, 2));

console.log('🎉 Deployment build completed successfully!');
console.log('📁 Output directory: dist/');
console.log('📄 Files created:');
console.log('  - server.js (bundled server)');
console.log('  - public/ (client assets)');
console.log('  - package.json (production config)');