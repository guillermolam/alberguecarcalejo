#!/bin/bash

# Build the Rust WASM module
echo "Building Validation BFF..."

# Install wasm-pack if not available
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build the WASM module
wasm-pack build --target web --out-dir ../client/src/lib/wasm

# Build country BFF
echo "Building Country BFF..."
cd country-bff
wasm-pack build --target web --out-dir ../../client/src/lib/wasm/country-bff
cd ..

echo "All BFF modules built successfully!"