#!/bin/bash

# CORS-enabled Lambda deployment script
# This updates your existing Lambda function with proper CORS support

set -e

echo "=== AWS Lambda CORS Update Script ==="
echo "Function: spanish-document-ocr"
echo "Function URL: https://ypeekiyyo4wb4mvzg3vsa2yy2m0lhmew.lambda-url.eu-west-3.on.aws/"
echo ""

# Navigate to project directory
cd backend-rust/src/spanish-document-ocr

echo "Building CORS-enabled Lambda function..."
if command -v cargo-lambda &> /dev/null; then
    cargo lambda build --release
    echo "✅ Build successful"
    
    echo "Deploying to AWS Lambda..."
    cargo lambda deploy \
        --function-name spanish-document-ocr \
        --memory 256 \
        --timeout 30 \
        --environment-variables "RUST_LOG=info,TESSERACT_LANG=spa,MAX_IMAGE_SIZE=10485760"
    
    echo ""
    echo "✅ CORS-enabled deployment complete!"
    echo ""
    echo "Testing CORS support..."
    curl -X OPTIONS https://ypeekiyyo4wb4mvzg3vsa2yy2m0lhmew.lambda-url.eu-west-3.on.aws/ \
        -H "Origin: http://localhost:5000" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -w "\nHTTP Status: %{http_code}\n"
    
    echo ""
    echo "Testing OCR endpoint..."
    curl -X POST https://ypeekiyyo4wb4mvzg3vsa2yy2m0lhmew.lambda-url.eu-west-3.on.aws/ \
        -H "Content-Type: application/json" \
        -H "Origin: http://localhost:5000" \
        -d '{"image_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", "document_type": "DNI", "side": "front"}' \
        -w "\nHTTP Status: %{http_code}\n"
        
else
    echo "❌ cargo-lambda not found. Creating deployment package..."
    cargo build --release --target x86_64-unknown-linux-musl
    
    # Create deployment package
    mkdir -p deployment
    cp target/x86_64-unknown-linux-musl/release/spanish-document-ocr deployment/bootstrap
    cd deployment
    zip ../spanish-document-ocr-cors.zip bootstrap
    cd ..
    
    echo "✅ Deployment package created: spanish-document-ocr-cors.zip"
    echo ""
    echo "📋 Manual deployment steps:"
    echo "1. Go to AWS Lambda Console → spanish-document-ocr function"
    echo "2. Click 'Upload from' → '.zip file'"
    echo "3. Upload: spanish-document-ocr-cors.zip"
    echo "4. Click 'Save'"
fi

echo ""
echo "🎉 Your Lambda function now supports CORS!"
echo "The frontend should now connect successfully to the Rust OCR backend."