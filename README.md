# KoboPot

KoboPot is a Stellar Testnet sandbox for personal savings pots. A person records a simulated Mobile Money purchase, KoboPot calculates a fixed saving or a round-up in pesewas, and the wallet approves an exact transfer of sandbox DUSD into a Soroban contract. Only the pot owner can withdraw, and an optional unlock time can keep the pot locked until that time.

Purchases are simulated. The exchange rate of 12.00 GHS per DUSD is a demonstration figure. DUSD has no real monetary value.

Live demo: [kobo-pot.vercel.app](https://kobo-pot.vercel.app)

## Built during Stellar 14

KoboPot did not exist on 4 October 2026. There is no commit before 5 October. The public repository [RicheySon/Kobo_Pot](https://github.com/RicheySon/Kobo_Pot) starts with commit `9f2226a` on 16 October 2026, inside the Stellar 14 judging window of 5–17 October 2026.

What landed in that window:

- A Soroban savings-pot contract with `create_pot`, `get_pot`, `contribute`, `withdraw`, and `close_pot`.
- Custody of the pot token, duplicate-reference rejection, owner-only withdrawal, and an unlock-time check. Fifteen contract tests cover those rules.
- A Next.js app with onboarding, pot creation, a simulated purchase, a dashboard, pot detail, and withdrawal.
- Stellar Wallets Kit on Testnet, so Connect wallet lists the supported Stellar wallets. Freighter is one of them.
- Testnet setup, DUSD asset deploy, contract deploy, and demo-seed scripts, plus GitHub Actions for the contract and the web app.
- Vercel settings for the hosted demo. Contract IDs stay out of git.

The hosted app can create a pot, show the DUSD amount before approval, accept a wallet signature, and read `get_pot` back onto the dashboard. Goal names, categories, notes, saving rules, and purchase descriptions stay in this browser. Balance, deposits, withdrawals, and unlock time come from the contract.

## Network

| Item | Value |
| --- | --- |
| Network | Stellar Testnet only. The app rejects any other network. |
| Live app | [https://kobo-pot.vercel.app](https://kobo-pot.vercel.app) |
| Explorer | [https://stellar.expert/explorer/testnet](https://stellar.expert/explorer/testnet) |
| Soroban RPC | `https://soroban-testnet.stellar.org` |
| Horizon | `https://horizon-testnet.stellar.org` |
| Token | DUSD, a Testnet Stellar Asset Contract with 7 decimal places |
| Demonstration rate | 12.00 GHS per DUSD. This is not a market price. |

The KoboPot contract ID and the DUSD token contract ID are printed by the deploy scripts. Put them in gitignored `apps/web/.env.local` or in the Vercel project settings. Do not commit them. The live app links each configured contract to the Testnet explorer.

## Try the demo

Use a Stellar wallet on Testnet. KoboPot never asks for a secret key or a seed phrase.

1. Open [the live app](https://kobo-pot.vercel.app) and connect the wallet.
2. Fund a new account with [Friendbot](https://developers.stellar.org/docs/learn/fundamentals/networks#friendbot). Friendbot sends Testnet XLM for fees.
3. Add a DUSD trustline for the issuer printed by `bash scripts/deploy-token.sh`, then ask the issuer to mint sandbox DUSD. `bash scripts/seed-demo.sh` does this for the local demo identity.
4. Create a pot. A 50.00 GHS goal with a fixed saving of 1.00 GHS and no unlock date is the scripted path.
5. Record a simulated purchase and approve the DUSD contribution.
6. Open the dashboard. The balance is the `get_pot` result. The transaction link opens Stellar Expert on Testnet.
7. Withdraw with the same wallet. A different wallet, a duplicate reference, or a withdrawal before the unlock time is rejected.

The click-by-click script is `docs/demo-script.md`.

## Layout

- `contracts/kobopot` — Soroban savings-pot contract
- `apps/web` — Next.js consumer app
- `scripts` — Testnet setup, token deploy, contract deploy, demo seed, and the secret scan
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

`apps/web/.env.example` lists variable names and leaves the contract IDs empty. Copy it to `apps/web/.env.local` for a local run. Where each public value comes from is in `docs/vercel.md`.

`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is optional. A project id from [Reown Cloud](https://cloud.reown.com) shows WalletConnect in the picker. Leave it empty to hide WalletConnect. Do not commit the id.

## Vercel

Set the project Root Directory to `apps/web`, enable source files outside that directory, and use Node.js 22. Install and build commands are in `apps/web/vercel.json`. Set the public variables from `docs/vercel.md` in Production, Preview, and Development, then redeploy. `NEXT_PUBLIC_` values are read at build time.

## Testnet scripts

```bash
bash scripts/setup-testnet.sh
bash scripts/deploy-token.sh
bash scripts/deploy-contract.sh
bash scripts/seed-demo.sh
```

The scripts refuse any network other than Testnet. They keep identities in the gitignored `.stellar` directory and print public addresses only. Deployment order and the expected command output are in `docs/deployment-runbook.md`.

## What must stay out of git

Do not commit any of the following:

- Stellar secret keys or seed phrases
- `.stellar/`
- `.env.local`, `.env.production`, or any filled env file
- KoboPot or DUSD contract IDs
- A WalletConnect or Reown project id

`bash scripts/scan-secrets.sh` checks the tree for a Stellar secret-key pattern and for a tracked env file other than `apps/web/.env.example`.

## Sandbox limits

There is no real Mobile Money automation, no Mainnet path in the app, and no real USDC. A typed purchase does not move cedis. The wallet signs the DUSD transfer separately. Details are in `docs/sandbox-limitations.md`.
