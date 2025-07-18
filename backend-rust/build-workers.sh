#!/bin/bash

echo "Building Rust WASM backend for Cloudflare Workers..."

# Install Rust target for WASM if not installed
rustup target add wasm32-unknown-unknown

# Build the Rust WASM module
cargo build --release --target wasm32-unknown-unknown

# Generate JS bindings
wasm-bindgen --out-dir build --web target/wasm32-unknown-unknown/release/albergue_backend.wasm

# Create the worker entry point
cat > build/worker.js << 'EOF'
import init, { handle_request } from './albergue_backend.js';

let wasmModule;

export default {
  async fetch(request, env, ctx) {
    if (!wasmModule) {
      wasmModule = await init();
    }
    
    return handle_request(request, env);
  }
}
EOF

echo "Build complete! Deploy with: wrangler deploy"