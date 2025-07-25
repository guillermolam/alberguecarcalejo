#!/bin/bash

echo "Building Rust-WASM BFF modules..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "wasm-pack not found. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build registration BFF
echo "Building registration BFF..."
cd bff/registration-bff
wasm-pack build --target web --out-dir pkg

# Build admin BFF
echo "Building admin BFF..."
cd ../admin-bff
wasm-pack build --target web --out-dir pkg

# Build country BFF
echo "Building country BFF..."
cd ../country-bff
wasm-pack build --target web --out-dir pkg

echo "Building backend Rust services..."
cd ../../backend-rust
./build.sh

cd ../..

echo "BFF modules built successfully!"
echo "Generated packages:"
echo "  - bff/registration-bff/pkg/"
echo "  - bff/admin-bff/pkg/"