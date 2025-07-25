#!/usr/bin/env node

import { build } from 'esbuild';

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
      'utf-8-validate'
    ],
    banner: {
      js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);'
    },
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    mainFields: ['module', 'main'],
    conditions: ['import', 'module', 'default'],
    logLevel: 'info'
  });
  
  console.log('✅ Server build completed successfully');
} catch (error) {
  console.error('❌ Server build failed:', error);
  process.exit(1);
}