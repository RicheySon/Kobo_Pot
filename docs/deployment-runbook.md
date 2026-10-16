# Deployment runbook

Use Stellar Testnet only. Do not commit `.env.local`, `.stellar`, or secret keys.

1. Check tools:

```bash
bash scripts/check-prerequisites.sh
stellar contract build
```

2. Create two local identities and fund them with Friendbot. The script prints public addresses only:

```bash
bash scripts/setup-testnet.sh
```

3. Deploy the DUSD Stellar Asset Contract. The issuer identity is the asset admin. Anyone can deploy the contract; the issuer can mint.

```bash
bash scripts/deploy-token.sh
```

4. Deploy the savings-pot wasm:

```bash
bash scripts/deploy-contract.sh
```

5. Copy the printed contract IDs into `NEXT_PUBLIC_CONTRACT_ID` and `NEXT_PUBLIC_TOKEN_CONTRACT_ID` in `apps/web/.env.local` for local runs, and into the Vercel project for a hosted build. Every variable and its source is listed in `docs/vercel.md`. Leave the other values matching `apps/web/.env.example`.

6. Open a DUSD trustline for the demo account, mint sandbox DUSD, create one pot, and contribute the rounded-down value of GHS 1.00:

```bash
bash scripts/seed-demo.sh
```

Record the contract IDs and transaction hashes from the command output. If a command fails, record that output and stop. Do not invent an ID.

Public IDs may be written into `STELLAR14_PROGRESS.md` after they appear in a successful command. Secret keys stay in `.stellar`.
