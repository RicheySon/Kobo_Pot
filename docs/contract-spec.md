# Contract spec

Package: `contracts/kobopot`. SDK: `soroban-sdk` 29.0.1. Network target: Stellar Testnet.

## Methods

`create_pot(owner, token, goal_amount, unlock_at) -> BytesN<32>`

The owner authorizes the call. `goal_amount` must be greater than zero. `unlock_at` of zero means the pot is not time-locked. Any other unlock time must be strictly after the ledger timestamp. The pot id is SHA-256 of the contract address XDR, owner XDR, token XDR, owner nonce, and goal. Ledger sequence and timestamp are not part of the hash, so the storage key written during execution matches the key recorded in simulation. The pot starts Active with zero balances.

`get_pot(pot_id) -> SavingsPot`

Returns the persistent record or `PotNotFound`. Reads extend instance and persistent TTL.

`contribute(pot_id, contributor, amount, reference_hash) -> SavingsPot`

The contributor authorizes the call. The pot must not be Closed. `amount` must be greater than zero. The reference hash must not be 32 zero bytes and must not already be stored for this pot. The same hash may be used on a different pot. The contract transfers `amount` of the pot token from the contributor to itself, then increments balance, total deposited, and contribution count. An Active pot becomes GoalReached when the balance reaches the goal. Later contributions are still accepted.

`withdraw(pot_id, owner, amount) -> SavingsPot`

The supplied owner must equal the stored owner, then that owner authorizes the call. Closed pots and locked pots are rejected. `amount` must be greater than zero and no larger than the balance. Accounting is updated before the token transfer, and the tokens go only to the stored owner. GoalReached stays GoalReached if the balance later falls below the goal.

`close_pot(pot_id, owner) -> SavingsPot`

The owner must match and authorize. A closed pot stays closed. A non-zero balance returns `InvalidStatus`. After closing, contribute, withdraw, and close fail with `PotClosed`.

## Errors

| Code | Name | When |
| --- | --- | --- |
| 1 | PotNotFound | Unknown pot id |
| 2 | InvalidGoal | Goal is not positive |
| 3 | InvalidAmount | Amount is not positive |
| 4 | InvalidUnlockTime | Unlock time is not zero and is not in the future |
| 5 | PotClosed | Pot is already closed |
| 6 | DuplicateReference | Reference hash was already used on this pot |
| 7 | Unauthorized | Caller is not the stored owner |
| 8 | InsufficientBalance | Withdrawal exceeds the balance |
| 9 | PotLocked | Ledger time is before unlock |
| 10 | ArithmeticError | Checked arithmetic failed |
| 11 | InvalidReference | Reference hash is all zeros |
| 12 | InvalidStatus | Close requested while a balance remains |

## Storage and events

Persistent keys are `Pot(id)`, `OwnerNonce(owner)`, and `ProcessedReference(pot_id, hash)`. Instance and persistent entries extend when the threshold is inside 30 days, out to 90 days, using 17,280 ledgers per day.

Events: `PotCreated`, `Contribution`, `GoalReachedEvent`, `FundsWithdrawn`, `PotClosed`.

Invariant: `balance = total_deposited - total_withdrawn`.
