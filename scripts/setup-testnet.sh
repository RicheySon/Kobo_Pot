#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

echo "Stellar config directory: $STELLAR_CONFIG_HOME"
DEMO_ADDRESS="$(ensure_identity "$KOBOPOT_DEMO_IDENTITY")"
ISSUER_ADDRESS="$(ensure_identity "$KOBOPOT_ISSUER_IDENTITY")"
echo "Demo public address: $DEMO_ADDRESS"
echo "Issuer public address: $ISSUER_ADDRESS"
fund_identity "$KOBOPOT_DEMO_IDENTITY"
fund_identity "$KOBOPOT_ISSUER_IDENTITY"
echo "Friendbot funding requested. Secret keys stay in $STELLAR_CONFIG_HOME and are not printed."
