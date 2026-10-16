# KoboPot acceptance criteria

- [x] New KoboPot project, with no cheque naming
- [x] Rust format, tests, clippy, and contract build pass
- [x] Frontend lint, type-check, tests, and production build pass
- [ ] Wallet connects on Testnet
- [x] Pot creation succeeds
- [x] Fixed and round-up calculations are correct
- [x] A contribution transfers the exact DUSD amount into contract custody
- [ ] Chain state updates the dashboard
- [x] A duplicate reference fails
- [x] A non-owner withdrawal fails
- [x] A pre-unlock withdrawal fails
- [x] An eligible withdrawal succeeds
- [x] Explorer links target Testnet
- [x] Sandbox notices are visible
- [x] No secrets are committed
- [x] README commands are reproducible

Wallet connection and the on-chain dashboard refresh still need Freighter in the browser. The contract checks above were run on Stellar Testnet with the Stellar CLI. See `STELLAR14_PROGRESS.md`.
