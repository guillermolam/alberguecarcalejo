{ pkgs }: {
  deps = [
    pkgs.rustup
    pkgs.outils
    # Essential tools
    pkgs.tree
    pkgs.git
    pkgs.curl
    pkgs.jq
    
    # Web server and proxy
    pkgs.caddy
    
    # Node.js ecosystem
    pkgs.nodejs_20
    pkgs.bun
    pkgs.yarn
    
    # Rust toolchain and WASM
    pkgs.rustc
    pkgs.cargo
    pkgs.rustfmt
    pkgs.clippy
    pkgs.wasm-pack
    pkgs.wasmtime

    # TLS/SSL
    pkgs.openssl
    
    # Database
    pkgs.postgresql_16
    pkgs.sqlx-cli
    
    # Fermyon Spin and WebAssembly
    pkgs.fermyon-spin
    
    # Build tools
    pkgs.pkg-config
    pkgs.openssl
    pkgs.libiconv

    # Linting | SAST
    pkgs.trunk-io
    
    # Development tools
    pkgs.go-task
    
    # Testing and QA
    pkgs.chromium
    pkgs.k6
    
    # CI/CD
    pkgs.act
    
    # Go (for additional tooling)
    pkgs.go

    #DAST | Pentesting
    pkgs.nuclei
  ];
}
