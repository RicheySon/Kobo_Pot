# Stellar 14 progress

These values come from commands run in this workspace on 2026-10-16. Secret keys are not listed.

| Item | Result |
| --- | --- |
| Rust | stable, target `wasm32v1-none` |
| Stellar CLI | 28.1.0 |
| Contract tests | `cargo test --workspace`: 15 passed |
| Optimized wasm | `target/wasm32v1-none/release/kobopot.wasm` |
| Wasm hash | `202dbd8a4452442177a4b3b876102da7d8410efb454c2012e56e1b7faa361c4f` |
| Demo account | `GCGHQ5UYCIATDJJWGN5KGUIFFRPTO35LTL3XSCPZW6SEB2GRF63VXJO3` |
| Issuer account | `GBS7Q3D5DWFZKYTPK5LFAJLHMP7LCXDBLJO2E23AMLQRQMIUS4OK3FMU` |
| DUSD token contract | `CB3IJM3BO5V5XQULRYZPDURO4NW7RJOBNCVQWUVF767CQULXXGI5HHAR` |
| KoboPot contract | `CBVNOGADSVJ7QZ5VEVLI23SINFMRKHYJ5BFNFCG2UBRWYS55AJKSRNE3` |
| Open pot | `c6842d5696e9a46e4ecba12f3aee37b4b62e35891d87b5b1aeae5359df0b68d3` |
| Locked pot | `32bd6a608c197b9706c4ab74a777a396b353366af2eaf2125762421403e4b455` |
| Mint transaction | `340803fded08fba9f4e2098784810e06d1c39a15ed32176b1ea6683e970d5af6` |
| Create-pot transaction | `2421e7ffc0d21b57a9c0abfa307c758ac4fae461cf4095cb33fb659edd4587e3` |
| Contribution transaction | `a8f0d8fca89c0495a1c4ae256d051ba2bd98f978637cd0828199f86706718827` |
| Withdrawal transaction | `783f7decb420218ce83fc29ba25c261a09afdcc91235f30ab024cb8ee8e8e891` |

The contribution moved 833333 DUSD base units into the contract. That is the rounded-down value of GHS 1.00 at the demonstration rate of 12.00 GHS per DUSD. A repeated reference failed with contract error 6. A withdrawal before unlock failed with error 9. A different account failed with error 7. The owner then withdrew 100000 base units. `get_pot` returned balance 733333, total deposited 833333, and total withdrawn 100000.

An earlier wasm, hash `6bbfcbee32a3e7b4c8fe61708faa6ffe87d662e3f69e39836258eb257e6f17c5`, was deployed as `CBBNR2D6JBJONFDXEGJLAUOZ2NUKUELOFP6KLDHNH4JB2NXP3VK4UXGT`. `create_pot` failed there because the pot id included the ledger sequence, so the executed storage key fell outside the simulated footprint. That contract is not the one configured for the app.

DUSD has no real monetary value. Purchases in the app remain simulated.
