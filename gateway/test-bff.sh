#!/bin/bash

# Test BFF architecture build and functionality
echo "🧪 Testing BFF Architecture..."

# Check if cargo build works
echo "📦 Checking Cargo build..."
cd bff
if cargo check; then
    echo "✅ Cargo check passed"
else
    echo "❌ Cargo check failed"
    exit 1
fi

# Test structure
echo "🏗️  Verifying BFF structure..."
if [ -f "src/lib.rs" ] && [ -f "src/auth_verify.rs" ] && [ -d "src/booking_service" ]; then
    echo "✅ BFF structure is correct"
else
    echo "❌ BFF structure incomplete"
    exit 1
fi

# Test spin.toml configuration
echo "📄 Verifying spin.toml configuration..."
cd ..
if [ -f "spin.toml" ] && grep -q "auth_verify.wasm" spin.toml; then
    echo "✅ spin.toml correctly configured"
else
    echo "❌ spin.toml configuration issue"
    exit 1
fi

echo "🎉 BFF Architecture tests completed successfully!"
echo "🚀 Ready for deployment to alberguecarrascalejo.fermyon.app"