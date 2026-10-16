# Mainnet migration

This repository does not deploy to Mainnet and the app refuses a non-Testnet configuration.

A later migration would need a separate review of:

- a published DUSD or other asset with a known issuer, not this sandbox token
- a new contract deployment and a new wasm hash recorded from that deployment
- wallet network checks against the public network passphrase
- explorer links that no longer point at `/testnet`
- removal of the simulated purchase path, or a clear replacement that is not labeled as Mobile Money
- legal, custody, and support review before any person is asked to deposit value

Until that review exists, keep `NEXT_PUBLIC_DEMO_MODE=true` and `NEXT_PUBLIC_STELLAR_NETWORK=testnet`.
