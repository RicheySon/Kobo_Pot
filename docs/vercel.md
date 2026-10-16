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

Set the variables below in Vercel for Production, Preview, and Development. The repository does not store `.env.production` or filled contract IDs.

## Environment variables

Every app variable is public (`NEXT_PUBLIC_`). Do not add a Stellar secret key, a seed phrase, or anything from `.stellar/` to Vercel, and do not commit those values.

`apps/web/.env.example` lists the variable names. Contract ID lines in that file stay empty. For a local run, copy it to gitignored `apps/web/.env.local` and fill the two contract IDs there. For a hosted build, enter the same names in Project → Settings → Environment Variables.

## Where each value comes from

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_APP_NAME` | Fixed by the app as `KoboPot`. Any other name is rejected. |
| `NEXT_PUBLIC_STELLAR_NETWORK` | Fixed by the app as `testnet`. Mainnet is rejected. |
| `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | Stellar’s published Testnet passphrase on [Networks](https://developers.stellar.org/docs/networks). |
| `NEXT_PUBLIC_STELLAR_RPC_URL` | Stellar’s public Testnet Soroban RPC: [RPC providers](https://developers.stellar.org/docs/data/rpc/rpc-providers). |
| `NEXT_PUBLIC_HORIZON_URL` | Stellar’s public Testnet Horizon: [Horizon](https://developers.stellar.org/docs/data/horizon). |
| `NEXT_PUBLIC_CONTRACT_ID` | Last line of `bash scripts/deploy-contract.sh` after `stellar contract build`. Keep it in `.env.local` or Vercel only. |
| `NEXT_PUBLIC_TOKEN_CONTRACT_ID` | Last line of `bash scripts/deploy-token.sh`. That command deploys the DUSD Stellar Asset Contract. Keep it in `.env.local` or Vercel only. |
| `NEXT_PUBLIC_TOKEN_SYMBOL` | `DUSD`, the asset code used by `scripts/deploy-token.sh`. The app rejects any other symbol. |
| `NEXT_PUBLIC_TOKEN_DECIMALS` | `7`. Stellar assets use 7 decimal places. This is the SAC base-unit scale, not a service you sign up for. |
| `NEXT_PUBLIC_EXPLORER_BASE_URL` | [Stellar Expert Testnet](https://stellar.expert/explorer/testnet). The URL must contain `/testnet`. |
| `NEXT_PUBLIC_DEMO_GHS_PER_DUSD` | `12.00`. The sandbox demonstration rate. It is not a market price and it is not loaded from an exchange. |
| `NEXT_PUBLIC_DEMO_MODE` | `true`. Fixed by the app. `false` is rejected. |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Optional. Create a project at [Reown Cloud](https://cloud.reown.com) and copy the project id. Leave it empty to hide WalletConnect. Do not commit the id. |

## Values that do not belong on Vercel

| Material | Where it lives |
| --- | --- |
| Demo and issuer secret keys | Gitignored `.stellar/` after `bash scripts/setup-testnet.sh`. The Stellar CLI prints public addresses only. |
| Stellar wallet | The visitor’s wallet, set to Testnet. Connect wallet lists the Stellar wallets supported by the app. |
| Testnet XLM for fees | [Friendbot](https://developers.stellar.org/docs/learn/fundamentals/networks#friendbot) or `stellar keys fund <identity> --network testnet`. |
| DUSD trustline and mint | `bash scripts/seed-demo.sh`, run locally by the issuer identity. |

## After changing a contract

1. Run `bash scripts/deploy-token.sh` or `bash scripts/deploy-contract.sh`.
2. Replace `NEXT_PUBLIC_TOKEN_CONTRACT_ID` or `NEXT_PUBLIC_CONTRACT_ID` in the Vercel project.
3. Redeploy. `NEXT_PUBLIC_` values are read when the site is built.
