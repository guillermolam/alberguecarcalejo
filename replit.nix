{ pkgs }: {
  deps = [
    pkgs.tree
    pkgs.caddy
    pkgs.nodejs_20
    pkgs.rustc
    pkgs.cargo
    pkgs.postgresql_16
    pkgs.wasm-pack
    pkgs.sqlx-cli
    pkgs.fermyon-spin
    pkgs.go
    pkgs.chromium
    pkgs.go-task
    pkgs.bun
    pkgs.k6
    pkgs.act
  ];
}
