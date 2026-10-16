#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if grep -RIlE \
  --exclude-dir=node_modules \
  --exclude-dir=target \
  --exclude-dir=.git \
  --exclude-dir=.next \
  --exclude-dir=.stellar \
  --binary-files=without-match \
  'S[A-Z2-7]{55}' .; then
  echo "A Stellar secret-key pattern was found. Remove it before committing." >&2
  exit 1
fi

echo "No Stellar secret-key pattern found."
