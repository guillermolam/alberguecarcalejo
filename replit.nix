{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.rustc
    pkgs.cargo
    pkgs.postgresql_16
    pkgs.wasm-pack
    pkgs.sqlx-cli
    pkgs.fermyon-spin
    pkgs.chromium
  ];
}
