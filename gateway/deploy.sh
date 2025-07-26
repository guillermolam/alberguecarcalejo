#!/usr/bin/env bash
# test-deploy-start-gateway.sh
# ------------------------------------------------------------
# Build, test‑run, and optionally deploy the Spin gateway.
# Usage:
#   ./test-deploy-start-gateway.sh           # local run only
#   ./test-deploy-start-gateway.sh --deploy  # run, then spin deploy
# ------------------------------------------------------------

set -euo pipefail

# 1) Required secrets (export in your shell or .env beforehand)
: "${AUTH_DOMAIN:?Need to set AUTH_DOMAIN (e.g. dev-foo.us.auth0.com)}"
: "${AUTH_CLIENT_ID:?Need to set AUTH_CLIENT_ID}"
export AUTH_DOMAIN AUTH_CLIENT_ID       # visible to Spin runtime

# 2) Build all Rust crates in release mode for WASI
echo "🛠  Building Rust workspace (WASM32‑WASI)…"
cargo build --workspace --release --target wasm32-wasi

# 3) Build Spin application
echo "📦  spin build (gateway + services)…"
spin build

# 4) Start Spin in the background on 127.0.0.1:3000
echo "🚀  Starting Spin runtime… (Ctrl‑C to stop)"
spin up --listen 127.0.0.1:3000 &
SPIN_PID=$!

# 5) If gateway/Caddyfile exists, start Caddy to proxy /api/*
if [[ -f "gateway/Caddyfile" ]]; then
  echo "🔐  Launching Caddy (TLS + HTTP/3)…"
  ( cd gateway && caddy run --config Caddyfile ) &
  CADDY_PID=$!
fi

# Open browser to API root (optional)
sleep 2
echo "🌐  Try https://api.alberguedelcarrascalejo.com/api/ping (or localhost:3000) in your browser."

# 6) Wait for Spin to exit (Ctrl‑C)
wait $SPIN_PID

# 7) Optional deploy step
if [[ "${1:-}" == "--deploy" ]]; then
  echo "🚢  Deploying to Fermyon Cloud…"
  spin deploy          # requires FERMyon token in env or ~/.spin/config
fi

# Cleanup Caddy if running
trap "[[ -n ${CADDY_PID:-} ]] && kill $CADDY_PID 2>/dev/null || true" EXIT
