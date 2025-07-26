
{
  description = "Albergue Del Carrascalejo - Hostel Management System";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    spin = {
      url = "github:fermyon/spin";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay, spin }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };

        # Rust toolchain with WASM target
        rustToolchain = pkgs.rust-bin.stable.latest.default.override {
          extensions = [ "rust-src" "rust-analyzer" ];
          targets = [ "wasm32-wasi" "wasm32-unknown-unknown" ];
        };

        # Node.js with specific version
        nodejs = pkgs.nodejs_20;
        
        # Bun package manager
        bun = pkgs.bun;
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Rust toolchain
            rustToolchain
            cargo
            rustfmt
            clippy
            
            # WASM tools
            wasm-pack
            wasmtime
            
            # Node.js ecosystem
            nodejs
            bun
            yarn
            
            # Database tools
            postgresql_16
            sqlx-cli
            
            # Fermyon Spin
            spin.packages.${system}.spin
            
            # Build tools
            pkg-config
            openssl
            
            # Development tools
            caddy
            git
            curl
            jq
            
            # Testing tools
            chromium
            
            # System dependencies
            libiconv
            darwin.apple_sdk.frameworks.Security or null
            darwin.apple_sdk.frameworks.CoreFoundation or null
            darwin.apple_sdk.frameworks.SystemConfiguration or null
          ] ++ lib.optionals stdenv.isDarwin [
            darwin.apple_sdk.frameworks.Security
            darwin.apple_sdk.frameworks.CoreFoundation
            darwin.apple_sdk.frameworks.SystemConfiguration
          ];

          shellHook = ''
            # Set up environment variables
            export RUST_SRC_PATH="${rustToolchain}/lib/rustlib/src/rust/src"
            export CARGO_TARGET_WASM32_WASI_RUNNER="wasmtime"
            export CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER="wasmtime"
            
            # Database setup
            export DATABASE_URL="postgresql://localhost:5432/albergue_dev"
            export NEON_DATABASE_URL="$DATABASE_URL"
            
            # Node.js setup
            export NODE_ENV="development"
            export PATH="$PWD/node_modules/.bin:$PATH"
            
            # Spin setup
            export SPIN_CONFIG_DIR="$PWD/.spin"
            
            # Create necessary directories
            mkdir -p .spin
            mkdir -p frontend/dist
            mkdir -p gateway/bff/target
            
            echo "🦀 Rust toolchain: $(rustc --version)"
            echo "📦 Node.js: $(node --version)"
            echo "🧶 Bun: $(bun --version)"
            echo "🌀 Spin: $(spin --version 2>/dev/null || echo 'not found')"
            echo ""
            echo "Available commands:"
            echo "  bun install          - Install Node.js dependencies"
            echo "  cargo build          - Build Rust services"
            echo "  spin build           - Build Spin application"
            echo "  spin up              - Run Spin application"
            echo "  task dev             - Run all services in dev mode"
            echo ""
          '';

          # Environment variables
          RUST_BACKTRACE = "1";
          RUST_LOG = "debug";
          PKG_CONFIG_PATH = "${pkgs.openssl.dev}/lib/pkgconfig";
          OPENSSL_DIR = "${pkgs.openssl.dev}";
          OPENSSL_LIB_DIR = "${pkgs.openssl.out}/lib";
          OPENSSL_INCLUDE_DIR = "${pkgs.openssl.dev}/include";
        };

        # Packages to export
        packages = {
          default = self.packages.${system}.albergue-app;
          
          albergue-app = pkgs.rustPlatform.buildRustPackage {
            pname = "albergue-app";
            version = "0.1.0";
            src = ./.;
            
            cargoLock = {
              lockFile = ./Cargo.lock;
            };
            
            nativeBuildInputs = with pkgs; [
              pkg-config
              rustToolchain
            ];
            
            buildInputs = with pkgs; [
              openssl
            ] ++ lib.optionals stdenv.isDarwin [
              darwin.apple_sdk.frameworks.Security
              darwin.apple_sdk.frameworks.CoreFoundation
              darwin.apple_sdk.frameworks.SystemConfiguration
            ];
            
            # Skip tests for now as they might require database setup
            doCheck = false;
            
            # Build only the workspace, not individual binaries
            cargoBuildFlags = [ "--workspace" ];
          };
        };
      }
    );
}
