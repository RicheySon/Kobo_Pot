# Demo script

Say this before clicking anything: purchases are simulated, 12.00 GHS per DUSD is a demonstration rate, and DUSD has no real monetary value.

1. Open the app and confirm the banner: “Stellar Testnet demo. Purchases and exchange rates are simulated. DUSD has no real monetary value.”
2. Connect Freighter on Testnet. If the account is empty, fund it with Friendbot.
3. Create a pot. Example: goal GHS 50.00, fixed saving GHS 1.00, no unlock date. Confirm the preview shows the DUSD base units before approval.
4. Open the new pot from the dashboard. The balance comes from `get_pot` after the wallet is connected.
5. Record a simulated purchase of GHS 17.00 with a round-up interval of GHS 5.00. The saving is GHS 3.00. An exact GHS 10.00 purchase with the same interval saves GHS 5.00.
6. Approve the contribution. The wallet signs a transfer of the rounded-down DUSD amount into the contract.
7. Refresh the pot. Progress, balance, and the Testnet explorer link update from the chain.
8. Try the same reference again. The contract returns duplicate-reference code 6.
9. Withdraw before an unlock time, or from a different wallet. The contract rejects the call.
10. After the unlock time, or immediately when the unlock is open, the owner withdraws. The dashboard balance drops.
