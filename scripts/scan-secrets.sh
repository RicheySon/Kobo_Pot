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

tracked_env="$(git ls-files | grep -E '(^|/)\.env($|\..*)' | grep -vE '(^|/)\.env\.example$' || true)"
if [ -n "$tracked_env" ]; then
  echo "Tracked environment files must not be committed:" >&2
  printf '%s\n' "$tracked_env" >&2
  exit 1
fi

if grep -Eq '^(NEXT_PUBLIC_CONTRACT_ID|NEXT_PUBLIC_TOKEN_CONTRACT_ID)=.+' apps/web/.env.example; then
  echo "apps/web/.env.example must leave contract IDs empty." >&2
  exit 1
fi
