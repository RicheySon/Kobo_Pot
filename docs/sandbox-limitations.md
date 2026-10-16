# Sandbox limitations

KoboPot is a Stellar Testnet demonstration.

- Mobile Money purchases are typed into the browser. Nothing reads SMS, and nothing talks to a Mobile Money provider.
- The rate `NEXT_PUBLIC_DEMO_GHS_PER_DUSD=12.00` is a fixed demonstration rate. It is not a market price.
- DUSD is a Testnet Stellar Asset Contract. It has no real monetary value and is not USDC.
- The app rejects a non-Testnet network name, a non-DUSD symbol, and explorer URLs that do not contain `/testnet`.
- Goal names, categories, notes, saving rules, and purchase descriptions stay in local storage. Phone numbers, merchant details, and personal notes are not contract fields.
- Chain reads use the connected account as the simulation source. An unfunded account needs Friendbot before the dashboard can refresh.
- A browser without Freighter can review calculations. It cannot sign a Testnet transaction.
- There is no yield, lending, KYC, custom anchor, or multi-currency ledger.
