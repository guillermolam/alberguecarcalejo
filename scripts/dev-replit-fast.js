
#!/usr/bin/env node
/**
 * Fast development script optimized for Bun and Replit
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('⚡ Starting FAST development mode...');

// Check if bun is available
const hasBun = (() => {
  try {
    require('child_process').execSync('which bun', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

const packageManager = hasBun ? 'bun' : 'npm';
console.log(`📦 Using ${packageManager} as package manager`);

// Start optimized development server
const devProcess = spawn(packageManager, ['run', 'dev'], {
  cwd: './frontend',
  stdio: 'inherit',
  env: {
    ...process.env,
    HOST: '0.0.0.0',
    PORT: '5173',
    // Bun optimizations
    BUN_JSC_forceICFailure: 'true',
    BUN_FEATURE_FLAG_DISABLE_PRETTIER: 'true'
  }
});

devProcess.on('error', (error) => {
  console.error('Failed to start dev server:', error);
  process.exit(1);
});

// Handle graceful shutdown
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    console.log(`\n🛑 Received ${signal}, shutting down...`);
    devProcess.kill(signal);
  });
});
