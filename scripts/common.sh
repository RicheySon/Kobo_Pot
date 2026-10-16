#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export STELLAR_CONFIG_HOME="${STELLAR_CONFIG_HOME:-$ROOT/.stellar}"
export KOBOPOT_NETWORK="${KOBOPOT_NETWORK:-testnet}"
export KOBOPOT_DEMO_IDENTITY="${KOBOPOT_DEMO_IDENTITY:-kobopot-demo}"
export KOBOPOT_ISSUER_IDENTITY="${KOBOPOT_ISSUER_IDENTITY:-kobopot-issuer}"
STATE_FILE="$STELLAR_CONFIG_HOME/kobopot.env"

if [[ "$KOBOPOT_NETWORK" != "testnet" ]]; then
  echo "KoboPot scripts run on Stellar Testnet only." >&2
  exit 1
fi

mkdir -p "$STELLAR_CONFIG_HOME"

ensure_identity() {
  local name="$1"
  if ! stellar keys address "$name" >/dev/null 2>&1; then
    stellar keys generate "$name" --network testnet
  fi
  stellar keys address "$name"
}

fund_identity() {
  local name="$1"
  stellar keys fund "$name" --network testnet
}

write_state() {
  local key="$1"
  local value="$2"
  touch "$STATE_FILE"
  if grep -q "^${key}=" "$STATE_FILE"; then
    local tmp
    tmp="$(mktemp)"
    grep -v "^${key}=" "$STATE_FILE" >"$tmp" || true
    mv "$tmp" "$STATE_FILE"
  fi
  printf '%s=%s\n' "$key" "$value" >>"$STATE_FILE"
}

read_state() {
  local key="$1"
  if [[ ! -f "$STATE_FILE" ]]; then
    return 1
  fi
  local line
  line="$(grep "^${key}=" "$STATE_FILE" | tail -n 1 || true)"
  if [[ -z "$line" ]]; then
    return 1
  fi
  printf '%s\n' "${line#*=}"
}
