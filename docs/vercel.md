# Vercel deployment

The hosted app is the Next.js project in `apps/web`. Contract deployment stays on your machine with the Stellar CLI. Vercel only builds and serves the website.

## Project settings

In the Vercel project:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root Directory | `apps/web` |
| Include source files outside the Root Directory | On |
| Node.js version | 22 |
| Install command | `npm ci --prefix ../..` |
| Build command | `next build` |

`apps/web/vercel.json` already sets the install and build commands. From `apps/web`, `../..` is the repository root, where `package-lock.json` lives. The build must include files outside `apps/web`.

Production, Preview, and Development can share these public values. A Vercel environment variable overrides the matching line in `apps/web/.env.production`.

## Environment variables

Every app variable is public (`NEXT_PUBLIC_`). Do not add a Stellar secret key, a seed phrase, or anything from `.stellar/` to Vercel.

Paste this set into Project → Settings → Environment Variables for Production, Preview, and Development:

```bash
NEXT_PUBLIC_APP_NAME=KoboPot
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_CONTRACT_ID=CBVNOGADSVJ7QZ5VEVLI23SINFMRKHYJ5BFNFCG2UBRWYS55AJKSRNE3
NEXT_PUBLIC_TOKEN_CONTRACT_ID=CB3IJM3BO5V5XQULRYZPDURO4NW7RJOBNCVQWUVF767CQULXXGI5HHAR
NEXT_PUBLIC_TOKEN_SYMBOL=DUSD
NEXT_PUBLIC_TOKEN_DECIMALS=7
NEXT_PUBLIC_EXPLORER_BASE_URL=https://stellar.expert/explorer/testnet
NEXT_PUBLIC_DEMO_GHS_PER_DUSD=12.00
NEXT_PUBLIC_DEMO_MODE=true
```

The two contract IDs above are the Testnet deployment recorded in `STELLAR14_PROGRESS.md`. They are public contract addresses. DUSD still has no real monetary value.

## Where each value comes from

| Variable | Value to use | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_NAME` | `KoboPot` | Fixed by the app. Any other name is rejected. |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` | Fixed by the app. Mainnet is rejected. |
| `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | `Test SDF Network ; September 2015` | Stellar’s published Testnet passphrase: [Networks](https://developers.stellar.org/docs/networks). |
| `NEXT_PUBLIC_STELLAR_RPC_URL` | `https://soroban-testnet.stellar.org` | Stellar’s public Testnet Soroban RPC: [RPC providers](https://developers.stellar.org/docs/data/rpc/rpc-providers). |
| `NEXT_PUBLIC_HORIZON_URL` | `https://horizon-testnet.stellar.org` | Stellar’s public Testnet Horizon: [Horizon](https://developers.stellar.org/docs/data/horizon). |
| `NEXT_PUBLIC_CONTRACT_ID` | `C` + 55 characters | Last line of `bash scripts/deploy-contract.sh` after `stellar contract build`. The current sandbox contract is `CBVNOGADSVJ7QZ5VEVLI23SINFMRKHYJ5BFNFCG2UBRWYS55AJKSRNE3`. |
| `NEXT_PUBLIC_TOKEN_CONTRACT_ID` | `C` + 55 characters | Last line of `bash scripts/deploy-token.sh`. That command deploys the DUSD Stellar Asset Contract. The current sandbox token is `CB3IJM3BO5V5XQULRYZPDURO4NW7RJOBNCVQWUVF767CQULXXGI5HHAR`. |
| `NEXT_PUBLIC_TOKEN_SYMBOL` | `DUSD` | The asset code used by `scripts/deploy-token.sh`. The app rejects any other symbol. |
| `NEXT_PUBLIC_TOKEN_DECIMALS` | `7` | Stellar assets use 7 decimal places. This is the SAC base-unit scale, not a service you sign up for. |
| `NEXT_PUBLIC_EXPLORER_BASE_URL` | `https://stellar.expert/explorer/testnet` | [Stellar Expert Testnet](https://stellar.expert/explorer/testnet). The URL must contain `/testnet`. |
| `NEXT_PUBLIC_DEMO_GHS_PER_DUSD` | `12.00` | The sandbox demonstration rate. It is not a market price and it is not loaded from an exchange. |
| `NEXT_PUBLIC_DEMO_MODE` | `true` | Fixed by the app. `false` is rejected. |

## Values that do not belong on Vercel

| Material | Where it lives |
| --- | --- |
| Demo and issuer secret keys | Gitignored `.stellar/` after `bash scripts/setup-testnet.sh`. The Stellar CLI prints public addresses only. |
| Freighter account | The visitor’s browser extension, set to Testnet. |
| Testnet XLM for fees | [Friendbot](https://developers.stellar.org/docs/learn/fundamentals/networks#friendbot) or `stellar keys fund <identity> --network testnet`. |
| DUSD trustline and mint | `bash scripts/seed-demo.sh`, run locally by the issuer identity. |

## After changing a contract

1. Run `bash scripts/deploy-token.sh` or `bash scripts/deploy-contract.sh`.
2. Replace `NEXT_PUBLIC_TOKEN_CONTRACT_ID` or `NEXT_PUBLIC_CONTRACT_ID` in the Vercel project.
3. Redeploy. `NEXT_PUBLIC_` values are read when the site is built.
