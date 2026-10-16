#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

TOKEN_ID="${TOKEN_CONTRACT_ID:-$(read_state TOKEN_CONTRACT_ID || true)}"
CONTRACT_ID="${CONTRACT_ID:-$(read_state CONTRACT_ID || true)}"
if [[ -z "${TOKEN_ID}" || -z "${CONTRACT_ID}" ]]; then
  echo "Deploy the token and contract before seeding. IDs are read from .stellar/kobopot.env." >&2
  exit 1
fi

DEMO_ADDRESS="$(ensure_identity "$KOBOPOT_DEMO_IDENTITY")"
ISSUER_ADDRESS="$(ensure_identity "$KOBOPOT_ISSUER_IDENTITY")"
fund_identity "$KOBOPOT_DEMO_IDENTITY"

echo "Opening a DUSD trustline for the demo account. DUSD has no real monetary value."
stellar tx new change-trust \
  --source-account "$KOBOPOT_DEMO_IDENTITY" \
  --network testnet \
  --line "DUSD:$ISSUER_ADDRESS"

echo "Minting 10 sandbox DUSD to the demo account. DUSD has no real monetary value."
stellar contract invoke \
  --id "$TOKEN_ID" \
  --source "$KOBOPOT_ISSUER_IDENTITY" \
  --network testnet \
  --send=yes \
  -- \
  mint \
  --to "$DEMO_ADDRESS" \
  --amount 100000000

echo "Creating a savings pot with a 5 DUSD goal and no time lock."
POT_ID="$(
  stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source "$KOBOPOT_DEMO_IDENTITY" \
    --network testnet \
    --send=yes \
    -- \
    create_pot \
    --owner "$DEMO_ADDRESS" \
    --token "$TOKEN_ID" \
    --goal_amount 50000000 \
    --unlock_at 0
)"
echo "Pot id: $POT_ID"

REF="KBP-$(date -u +%Y%m%d)-$(cat /proc/sys/kernel/random/uuid)"
HASH="$(printf '%s' "$REF" | sha256sum | awk '{print $1}')"
echo "Simulated purchase reference (not stored on-chain): $REF"
echo "Contributing 833333 DUSD base units, the rounded-down value of GHS 1.00 at 12.00 GHS per DUSD."
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$KOBOPOT_DEMO_IDENTITY" \
  --network testnet \
  --send=yes \
  -- \
  contribute \
  --pot_id "$POT_ID" \
  --contributor "$DEMO_ADDRESS" \
  --amount 833333 \
  --reference_hash "$HASH"

echo "Reading the pot back from Testnet."
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$KOBOPOT_DEMO_IDENTITY" \
  --network testnet \
  --send=no \
  -- \
  get_pot \
  --pot_id "$POT_ID"
