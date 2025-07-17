#!/bin/bash

# Build the Rust WASM module
wasm-pack build --target web --out-dir ../bff/wasm/country-service

# Copy the generated files to the BFF directory
mkdir -p ../bff/wasm
cp -r pkg/* ../bff/wasm/country-service/ 2>/dev/null || true

echo "Country service WASM module built successfully"