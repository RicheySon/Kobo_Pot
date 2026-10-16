#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

ISSUER_ADDRESS="$(ensure_identity "$KOBOPOT_ISSUER_IDENTITY")"
fund_identity "$KOBOPOT_ISSUER_IDENTITY"
echo "Deploying a DUSD Stellar Asset Contract on Testnet."
echo "Issuer public address: $ISSUER_ADDRESS"
TOKEN_ID="$(
  stellar contract asset deploy \
    --asset "DUSD:$ISSUER_ADDRESS" \
    --source-account "$KOBOPOT_ISSUER_IDENTITY" \
    --network testnet \
    --quiet
)"
TOKEN_ID="$(printf '%s\n' "$TOKEN_ID" | tail -n 1 | tr -d '[:space:]')"
if [[ ! "$TOKEN_ID" =~ ^C[A-Z0-9]{55}$ ]]; then
  echo "Token deployment did not return a contract ID." >&2
  printf '%s\n' "$TOKEN_ID" >&2
  exit 1
fi
write_state TOKEN_CONTRACT_ID "$TOKEN_ID"
echo "DUSD token contract ID: $TOKEN_ID"
