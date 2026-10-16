#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

WASM="$ROOT/target/wasm32v1-none/release/kobopot.wasm"
if [[ ! -f "$WASM" ]]; then
  echo "Build the contract first: stellar contract build" >&2
  exit 1
fi
ensure_identity "$KOBOPOT_DEMO_IDENTITY" >/dev/null
fund_identity "$KOBOPOT_DEMO_IDENTITY"
echo "Deploying KoboPot to Stellar Testnet from $WASM"
CONTRACT_ID="$(
  stellar contract deploy \
    --wasm "$WASM" \
    --source-account "$KOBOPOT_DEMO_IDENTITY" \
    --network testnet \
    --quiet
)"
CONTRACT_ID="$(printf '%s\n' "$CONTRACT_ID" | tail -n 1 | tr -d '[:space:]')"
if [[ ! "$CONTRACT_ID" =~ ^C[A-Z0-9]{55}$ ]]; then
  echo "Contract deployment did not return a contract ID." >&2
  printf '%s\n' "$CONTRACT_ID" >&2
  exit 1
fi
write_state CONTRACT_ID "$CONTRACT_ID"
echo "KoboPot contract ID: $CONTRACT_ID"
echo "Copy CONTRACT_ID and TOKEN_CONTRACT_ID into apps/web/.env.local. Do not commit that file."
