#!/bin/bash

# Cargo Build Script for Rust WASM Microservices
# Provides comprehensive Cargo integration for the project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check Rust installation
check_rust() {
    print_status "Checking Rust installation..."
    
    if ! command -v rustc &> /dev/null; then
        print_error "Rust not found. Please install from https://rustup.rs/"
        exit 1
    fi
    
    if ! command -v cargo &> /dev/null; then
        print_error "Cargo not found. Please install Rust with Cargo"
        exit 1
    fi
    
    print_success "Rust $(rustc --version) found"
    print_success "Cargo $(cargo --version) found"
}

# Function to check and install wasm-pack
setup_wasm_tools() {
    print_status "Setting up WASM tools..."
    
    if ! command -v wasm-pack &> /dev/null; then
        print_status "Installing wasm-pack..."
        cargo install wasm-pack
    fi
    
    if ! rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
        print_status "Adding WASM target..."
        rustup target add wasm32-unknown-unknown
    fi
    
    print_success "WASM tools ready"
}

# Function to run Cargo commands
cargo_check() {
    print_status "Running Cargo checks..."
    cd backend/services
    
    print_status "Checking code syntax..."
    cargo check
    
    print_status "Running tests..."
    cargo test
    
    print_status "Checking code formatting..."
    cargo fmt --check || {
        print_warning "Code formatting needed. Running cargo fmt..."
        cargo fmt
    }
    
    print_status "Running Clippy linter..."
    cargo clippy -- -D warnings
    
    cd ../..
    print_success "All Cargo checks passed"
}

# Function to build Rust workspace
cargo_build() {
    print_status "Building Rust workspace..."
    cd backend/services
    
    cargo build --release
    
    cd ../..
    print_success "Workspace built successfully"
}

# Function to clean builds
cargo_clean() {
    print_status "Cleaning Cargo builds..."
    cd backend/services
    
    cargo clean
    
    cd ../..
    rm -rf pkg/
    rm -rf backend/services/pkg/
    rm -rf backend/services/*/pkg/
    
    print_success "Build artifacts cleaned"
}

# Function to show Cargo information
cargo_info() {
    print_status "Cargo workspace information:"
    cd backend/services
    
    echo ""
    echo "Workspace members:"
    cargo metadata --format-version 1 | grep '"name"' | head -10
    
    echo ""
    echo "Dependencies:"
    cargo tree --depth 1
    
    cd ../..
}

# Function to build individual WASM packages
build_wasm() {
    print_status "Building WASM packages..."
    
    setup_wasm_tools
    
    mkdir -p pkg
    
    services=("database" "validation" "country" "security" "ocr")
    
    for service in "${services[@]}"; do
        if [ -d "backend/services/$service" ]; then
            print_status "Building $service service..."
            cd "backend/services/$service"
            wasm-pack build \
                --target web \
                --out-dir "../../../pkg/$service" \
                --release
            cd "../../.."
            print_success "$service WASM package built"
        else
            print_warning "$service directory not found, skipping"
        fi
    done
}

# Function to show usage
show_usage() {
    echo "Cargo Build Script for Rust WASM Microservices"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  check     Run Cargo checks (syntax, tests, format, clippy)"
    echo "  build     Build Rust workspace"
    echo "  wasm      Build WASM packages"
    echo "  clean     Clean all build artifacts"
    echo "  info      Show workspace information"
    echo "  setup     Install and setup WASM tools"
    echo "  all       Run complete build pipeline"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 check    # Run all code checks"
    echo "  $0 wasm     # Build WASM packages only"
    echo "  $0 all      # Complete build pipeline"
}

# Main execution
main() {
    case "${1:-help}" in
        "check")
            check_rust
            cargo_check
            ;;
        "build")
            check_rust
            cargo_build
            ;;
        "wasm")
            check_rust
            build_wasm
            ;;
        "clean")
            cargo_clean
            ;;
        "info")
            check_rust
            cargo_info
            ;;
        "setup")
            check_rust
            setup_wasm_tools
            ;;
        "all")
            check_rust
            setup_wasm_tools
            cargo_clean
            cargo_check
            cargo_build
            build_wasm
            print_success "Complete build pipeline finished!"
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        *)
            print_error "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
}

main "$@"