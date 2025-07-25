# Monorepo Scripts Directory

This directory contains all global build, deployment, and development scripts for the WASM microservices architecture.

## Usage

All scripts should be run from the project root using:
```bash
bash scripts/script-name.sh
```

## Available Scripts

### Build Scripts
- `build-wasm.sh` - Build all Rust WASM microservices for Spin deployment
- `build-production.js` - Production build script
- `build-server.js` - Server build script
- `cargo-build.sh` - Cargo-specific build operations

### Development Scripts  
- `dev-replit.sh` - Start development server for Replit environment
- `run-dev-replit.sh` - Alternative development startup script
- `vite-dev-server.js` - Vite development server configuration

### Deployment Scripts
- `deploy-build.js` - Deployment build process
- `wasm-dev.sh` - WASM development utilities

## Architecture Integration

These scripts work with the DDD microservices architecture:
- All services located under `services/` directory
- Gateway component in `gateway/` directory
- No legacy `backend/` folder references
- Port 80 configuration for Spin deployment

## Examples

```bash
# Build all WASM services
bash scripts/build-wasm.sh

# Start development server
bash scripts/dev-replit.sh

# Deploy application
bash scripts/deploy-build.js
```