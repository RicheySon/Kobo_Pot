#!/usr/bin/env bash
set -euo pipefail

missing=0
need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1" >&2
    missing=1
  else
    echo "$1: $($1 --version | head -n 1)"
  fi
}

need git
need node
need npm
need rustc
need cargo
need stellar

if [[ "$missing" -ne 0 ]]; then
  exit 1
fi

rustup target list --installed | grep -qx 'wasm32v1-none' || {
  echo "Missing rustup target wasm32v1-none" >&2
  exit 1
}
echo "wasm32v1-none is installed"
echo "Prerequisites are present for the KoboPot Testnet sandbox."
