use soroban_sdk::{Address, BytesN, Env};

use crate::errors::ContractError;
use crate::types::{DataKey, SavingsPot};

/// ~5 second ledgers. Extend well below the network max entry TTL.
const LEDGERS_PER_DAY: u32 = 17_280;
const TTL_THRESHOLD: u32 = 30 * LEDGERS_PER_DAY;
const TTL_EXTEND_TO: u32 = 90 * LEDGERS_PER_DAY;

pub fn bump_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
}

pub fn bump_persistent(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, TTL_THRESHOLD, TTL_EXTEND_TO);
}

pub fn read_pot(env: &Env, pot_id: &BytesN<32>) -> Result<SavingsPot, ContractError> {
    let key = DataKey::Pot(pot_id.clone());
    let pot = env
        .storage()
        .persistent()
        .get(&key)
        .ok_or(ContractError::PotNotFound)?;
    bump_persistent(env, &key);
    bump_instance(env);
    Ok(pot)
}

pub fn write_pot(env: &Env, pot: &SavingsPot) {
    let key = DataKey::Pot(pot.id.clone());
    env.storage().persistent().set(&key, pot);
    bump_persistent(env, &key);
    bump_instance(env);
}

pub fn take_nonce(env: &Env, owner: &Address) -> Result<u64, ContractError> {
    let key = DataKey::OwnerNonce(owner.clone());
    let current: u64 = env.storage().persistent().get(&key).unwrap_or(0);
    let next = current
        .checked_add(1)
        .ok_or(ContractError::ArithmeticError)?;
    env.storage().persistent().set(&key, &next);
    bump_persistent(env, &key);
    Ok(current)
}

pub fn reference_used(env: &Env, pot_id: &BytesN<32>, reference_hash: &BytesN<32>) -> bool {
    let key = DataKey::ProcessedReference(pot_id.clone(), reference_hash.clone());
    let used = env.storage().persistent().has(&key);
    if used {
        bump_persistent(env, &key);
    }
    used
}

pub fn mark_reference(env: &Env, pot_id: &BytesN<32>, reference_hash: &BytesN<32>) {
    let key = DataKey::ProcessedReference(pot_id.clone(), reference_hash.clone());
    env.storage().persistent().set(&key, &true);
    bump_persistent(env, &key);
}
