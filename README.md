# KoboPot

KoboPot is a Stellar Testnet sandbox for personal savings pots. A person records a simulated Mobile Money purchase, KoboPot calculates a fixed or round-up saving in pesewas, and an approved transaction moves sandbox DUSD into a Soroban contract.

Purchases are simulated. The exchange rate of 12.00 GHS per DUSD is a demonstration figure. DUSD has no real monetary value.

## Layout

- `contracts/kobopot` — Soroban savings-pot contract
- `apps/web` — Next.js consumer app
- `scripts` — Testnet setup, token deploy, contract deploy, and a demo seed
- `docs` — architecture, contract spec, sandbox limits, deployment, demo, and a Mainnet migration note

## Prerequisites

- Node.js 22
- Rust stable with the `wasm32v1-none` target, rustfmt, and clippy
- Stellar CLI 28.1.0

```bash
bash scripts/check-prerequisites.sh
```

## Contract

```bash
cargo fmt --all -- --check
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
stellar contract build
```

The optimized wasm is written to `target/wasm32v1-none/release/kobopot.wasm`.

## Frontend

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run dev
```

Variable names and where to obtain each one are in `docs/vercel.md`. Copy `apps/web/.env.example` to `apps/web/.env.local` and set the contract IDs there. Do not commit `.env.local`, `.env.production`, or secret keys. Hosted builds read the same variables from the Vercel project settings.

## Vercel

Set the project Root Directory to `apps/web`, enable source files outside that directory, and use Node.js 22. Install and build commands are in `apps/web/vercel.json`. The full variable list is in `docs/vercel.md`.

## Testnet

```bash
bash scripts/setup-testnet.sh
bash scripts/deploy-token.sh
bash scripts/deploy-contract.sh
bash scripts/seed-demo.sh
```

Scripts keep identities in the gitignored `.stellar` directory and print public addresses only. See `docs/deployment-runbook.md` and `docs/demo-script.md`.

## Sandbox limits

There is no real Mobile Money automation, no Mainnet path in the app, and no real USDC. Details are in `docs/sandbox-limitations.md`.
