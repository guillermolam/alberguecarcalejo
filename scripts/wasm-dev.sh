#!/bin/bash

# WASM Development Script
# Quick development commands for Rust WASM services

set -e

# Quick WASM build for development
quick_build() {
    echo "🚀 Quick WASM build for development..."
    
    # Build only the services that exist
    services=("database" "validation" "country" "security" "ocr")
    
    mkdir -p pkg
    
    for service in "${services[@]}"; do
        if [ -d "backend/services/$service" ]; then
            echo "📦 Building $service..."
            cd "backend/services/$service"
            wasm-pack build --target web --out-dir "../../../pkg/$service" --dev
            cd "../../.."
        fi
    done
    
    echo "✅ Quick WASM build complete!"
}

# Watch and rebuild on changes
watch_build() {
    echo "👀 Watching for changes in Rust services..."
    
    if ! command -v cargo-watch &> /dev/null; then
        echo "📦 Installing cargo-watch..."
        cargo install cargo-watch
    fi
    
    cd backend/services
    cargo watch -x "build" -x "test"
}

# Development server with WASM rebuild
dev_server() {
    echo "🔥 Starting development with WASM rebuild..."
    
    # Build WASM first
    quick_build
    
    # Start development server
    npm run dev
}

# Test individual service
test_service() {
    local service="$1"
    
    if [ -z "$service" ]; then
        echo "❌ Please specify a service name"
        echo "Available services: database, validation, country, security, ocr"
        exit 1
    fi
    
    if [ -d "backend/services/$service" ]; then
        echo "🧪 Testing $service service..."
        cd "backend/services/$service"
        cargo test
        cd "../../.."
    else
        echo "❌ Service $service not found"
        exit 1
    fi
}

# Show usage
show_usage() {
    echo "WASM Development Script"
    echo ""
    echo "Usage: $0 [command] [args]"
    echo ""
    echo "Commands:"
    echo "  quick      Quick WASM build for development"
    echo "  watch      Watch and rebuild on changes"
    echo "  dev        Start development server with WASM"
    echo "  test       Test specific service"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 quick           # Quick development build"
    echo "  $0 watch           # Watch for changes"
    echo "  $0 dev             # Start dev server"
    echo "  $0 test database   # Test database service"
}

# Main execution
case "${1:-help}" in
    "quick")
        quick_build
        ;;
    "watch")
        watch_build
        ;;
    "dev")
        dev_server
        ;;
    "test")
        test_service "$2"
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        echo "❌ Unknown command: $1"
        show_usage
        exit 1
        ;;
esac