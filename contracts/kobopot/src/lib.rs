#![no_std]

mod errors;
mod events;
mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, token, xdr::ToXdr, Address, Bytes, BytesN, Env};

use errors::ContractError;
use events::{Contribution, FundsWithdrawn, GoalReachedEvent, PotClosed, PotCreated};
use storage::{bump_instance, mark_reference, read_pot, reference_used, take_nonce, write_pot};
use types::{PotStatus, SavingsPot};

#[contract]
pub struct KoboPotContract;

#[contractimpl]
impl KoboPotContract {
    /// Create a savings pot. `unlock_at` of zero means the pot is never time-locked.
    /// A non-zero unlock must be strictly in the future.
    pub fn create_pot(
        env: Env,
        owner: Address,
        token: Address,
        goal_amount: i128,
        unlock_at: u64,
    ) -> Result<BytesN<32>, ContractError> {
        owner.require_auth();
        if goal_amount <= 0 {
            return Err(ContractError::InvalidGoal);
        }
        let now = env.ledger().timestamp();
        if unlock_at != 0 && unlock_at <= now {
            return Err(ContractError::InvalidUnlockTime);
        }

        let nonce = take_nonce(&env, &owner)?;
        let pot_id = pot_id(&env, &owner, &token, nonce, goal_amount);
        let pot = SavingsPot {
            id: pot_id.clone(),
            owner: owner.clone(),
            token: token.clone(),
            goal_amount,
            balance: 0,
            total_deposited: 0,
            total_withdrawn: 0,
            contribution_count: 0,
            created_at: now,
            unlock_at,
            status: PotStatus::Active,
        };
        write_pot(&env, &pot);
        bump_instance(&env);
        PotCreated {
            pot_id: pot_id.clone(),
            owner,
            token,
            goal_amount,
            unlock_at,
        }
        .publish(&env);
        Ok(pot_id)
    }

    pub fn get_pot(env: Env, pot_id: BytesN<32>) -> Result<SavingsPot, ContractError> {
        read_pot(&env, &pot_id)
    }

    /// Transfer `amount` of the pot token into contract custody and credit the pot.
    /// `reference_hash` must be unique per pot. GoalReached stays open for more contributions.
    pub fn contribute(
        env: Env,
        pot_id: BytesN<32>,
        contributor: Address,
        amount: i128,
        reference_hash: BytesN<32>,
    ) -> Result<SavingsPot, ContractError> {
        contributor.require_auth();
        let mut pot = read_pot(&env, &pot_id)?;
        if pot.status == PotStatus::Closed {
            return Err(ContractError::PotClosed);
        }
        if amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }
        if is_zero_hash(&env, &reference_hash) {
            return Err(ContractError::InvalidReference);
        }
        if reference_used(&env, &pot_id, &reference_hash) {
            return Err(ContractError::DuplicateReference);
        }

        token::TokenClient::new(&env, &pot.token).transfer(
            &contributor,
            env.current_contract_address(),
            &amount,
        );

        pot.balance = pot
            .balance
            .checked_add(amount)
            .ok_or(ContractError::ArithmeticError)?;
        pot.total_deposited = pot
            .total_deposited
            .checked_add(amount)
            .ok_or(ContractError::ArithmeticError)?;
        pot.contribution_count = pot
            .contribution_count
            .checked_add(1)
            .ok_or(ContractError::ArithmeticError)?;

        let reached_goal = pot.status == PotStatus::Active && pot.balance >= pot.goal_amount;
        if reached_goal {
            pot.status = PotStatus::GoalReached;
        }

        mark_reference(&env, &pot_id, &reference_hash);
        write_pot(&env, &pot);
        Contribution {
            pot_id: pot_id.clone(),
            contributor,
            amount,
            balance: pot.balance,
            reference_hash,
        }
        .publish(&env);
        if reached_goal {
            GoalReachedEvent {
                pot_id,
                balance: pot.balance,
                goal_amount: pot.goal_amount,
            }
            .publish(&env);
        }
        Ok(pot)
    }

    /// Send `amount` of the pot token to the stored owner. Status does not revert
    /// from GoalReached when the balance falls back under the goal.
    pub fn withdraw(
        env: Env,
        pot_id: BytesN<32>,
        owner: Address,
        amount: i128,
    ) -> Result<SavingsPot, ContractError> {
        let mut pot = read_pot(&env, &pot_id)?;
        if owner != pot.owner {
            return Err(ContractError::Unauthorized);
        }
        pot.owner.require_auth();
        if pot.status == PotStatus::Closed {
            return Err(ContractError::PotClosed);
        }
        let now = env.ledger().timestamp();
        if pot.unlock_at != 0 && now < pot.unlock_at {
            return Err(ContractError::PotLocked);
        }
        if amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }
        if amount > pot.balance {
            return Err(ContractError::InsufficientBalance);
        }

        pot.balance = pot
            .balance
            .checked_sub(amount)
            .ok_or(ContractError::ArithmeticError)?;
        pot.total_withdrawn = pot
            .total_withdrawn
            .checked_add(amount)
            .ok_or(ContractError::ArithmeticError)?;
        write_pot(&env, &pot);

        token::TokenClient::new(&env, &pot.token).transfer(
            &env.current_contract_address(),
            &pot.owner,
            &amount,
        );

        FundsWithdrawn {
            pot_id,
            owner: pot.owner.clone(),
            amount,
            balance: pot.balance,
        }
        .publish(&env);
        Ok(pot)
    }

    /// Close a pot that holds zero tokens. Closed pots reject new contributions.
    pub fn close_pot(
        env: Env,
        pot_id: BytesN<32>,
        owner: Address,
    ) -> Result<SavingsPot, ContractError> {
        let mut pot = read_pot(&env, &pot_id)?;
        if owner != pot.owner {
            return Err(ContractError::Unauthorized);
        }
        pot.owner.require_auth();
        if pot.status == PotStatus::Closed {
            return Err(ContractError::PotClosed);
        }
        if pot.balance != 0 {
            return Err(ContractError::InvalidStatus);
        }
        pot.status = PotStatus::Closed;
        write_pot(&env, &pot);
        PotClosed {
            pot_id,
            owner: pot.owner.clone(),
        }
        .publish(&env);
        Ok(pot)
    }
}

fn is_zero_hash(env: &Env, hash: &BytesN<32>) -> bool {
    hash == &BytesN::from_array(env, &[0u8; 32])
}

/// Id from the contract, owner, token, nonce, and goal.
/// Ledger sequence and timestamp stay out of the hash so simulation and
/// execution write the same storage key.
fn pot_id(
    env: &Env,
    owner: &Address,
    token: &Address,
    nonce: u64,
    goal_amount: i128,
) -> BytesN<32> {
    let mut payload = Bytes::new(env);
    payload.append(&env.current_contract_address().clone().to_xdr(env));
    payload.append(&owner.clone().to_xdr(env));
    payload.append(&token.clone().to_xdr(env));
    payload.append(&Bytes::from_array(env, &nonce.to_be_bytes()));
    payload.append(&Bytes::from_array(env, &goal_amount.to_be_bytes()));
    env.crypto().sha256(&payload).to_bytes()
}

#[cfg(test)]
mod test;
