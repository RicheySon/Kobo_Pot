use super::*;
use soroban_sdk::testutils::{Address as _, Events as _, Ledger as _};
use soroban_sdk::{
    token::{StellarAssetClient, TokenClient},
    Address, BytesN, ConversionError, Env, Event as _, InvokeError,
};

const MINT: i128 = 1_000_000_000_000;

struct World {
    env: Env,
    contract_id: Address,
    token: Address,
    owner: Address,
}

fn world() -> World {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|info| {
        info.timestamp = 1_000;
        info.sequence_number = 100;
    });

    let owner = Address::generate(&env);
    let issuer = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(issuer);
    let token = sac.address();
    StellarAssetClient::new(&env, &token).mint(&owner, &MINT);

    let contract_id = env.register(KoboPotContract, ());
    World {
        env,
        contract_id,
        token,
        owner,
    }
}

fn client(world: &World) -> KoboPotContractClient<'_> {
    KoboPotContractClient::new(&world.env, &world.contract_id)
}

fn hash(env: &Env, byte: u8) -> BytesN<32> {
    BytesN::from_array(env, &[byte; 32])
}

fn zero_hash(env: &Env) -> BytesN<32> {
    BytesN::from_array(env, &[0u8; 32])
}

fn token_balance(world: &World, address: &Address) -> i128 {
    TokenClient::new(&world.env, &world.token).balance(address)
}

fn assert_invariant(pot: &SavingsPot) {
    assert_eq!(
        pot.balance,
        pot.total_deposited - pot.total_withdrawn,
        "balance must equal deposits minus withdrawals"
    );
}

fn assert_contract_error<T: core::fmt::Debug>(
    result: Result<Result<T, ConversionError>, Result<ContractError, InvokeError>>,
    expected: ContractError,
) {
    match result {
        Err(Ok(error)) => assert_eq!(error, expected),
        other => panic!("expected contract error {expected:?}, got {other:?}"),
    }
}

#[test]
fn creates_a_pot() {
    let world = world();
    let id = client(&world).create_pot(&world.owner, &world.token, &1_000, &0);
    let expected = PotCreated {
        pot_id: id.clone(),
        owner: world.owner.clone(),
        token: world.token.clone(),
        goal_amount: 1_000,
        unlock_at: 0,
    }
    .to_xdr(&world.env, &world.contract_id);
    assert!(world
        .env
        .events()
        .all()
        .events()
        .iter()
        .any(|event| event == &expected));
    let pot = client(&world).get_pot(&id);
    assert_eq!(pot.id, id);
    assert_eq!(pot.owner, world.owner);
    assert_eq!(pot.token, world.token);
    assert_eq!(pot.goal_amount, 1_000);
    assert_eq!(pot.balance, 0);
    assert_eq!(pot.total_deposited, 0);
    assert_eq!(pot.total_withdrawn, 0);
    assert_eq!(pot.contribution_count, 0);
    assert_eq!(pot.created_at, 1_000);
    assert_eq!(pot.unlock_at, 0);
    assert_eq!(pot.status, PotStatus::Active);
    assert_invariant(&pot);
}

#[test]
fn rejects_invalid_goal() {
    let world = world();
    assert_contract_error(
        client(&world).try_create_pot(&world.owner, &world.token, &0, &0),
        ContractError::InvalidGoal,
    );
    assert_contract_error(
        client(&world).try_create_pot(&world.owner, &world.token, &-1, &0),
        ContractError::InvalidGoal,
    );
}

#[test]
fn rejects_past_or_present_unlock() {
    let world = world();
    assert_contract_error(
        client(&world).try_create_pot(&world.owner, &world.token, &100, &999),
        ContractError::InvalidUnlockTime,
    );
    assert_contract_error(
        client(&world).try_create_pot(&world.owner, &world.token, &100, &1_000),
        ContractError::InvalidUnlockTime,
    );
    let id = client(&world).create_pot(&world.owner, &world.token, &100, &1_001);
    assert_eq!(client(&world).get_pot(&id).unlock_at, 1_001);
}

#[test]
fn creates_multiple_unique_pots() {
    let world = world();
    let first = client(&world).create_pot(&world.owner, &world.token, &100, &0);
    let second = client(&world).create_pot(&world.owner, &world.token, &100, &0);
    assert_ne!(first, second);
    assert_eq!(client(&world).get_pot(&first).owner, world.owner);
    assert_eq!(client(&world).get_pot(&second).owner, world.owner);
}

#[test]
fn missing_pot_is_not_found() {
    let world = world();
    assert_contract_error(
        client(&world).try_get_pot(&hash(&world.env, 9)),
        ContractError::PotNotFound,
    );
}

#[test]
fn contribution_transfers_exact_tokens_and_updates_accounting() {
    let world = world();
    let id = client(&world).create_pot(&world.owner, &world.token, &10_000, &0);
    let before_owner = token_balance(&world, &world.owner);
    let before_contract = token_balance(&world, &world.contract_id);

    let pot = client(&world).contribute(&id, &world.owner, &250, &hash(&world.env, 1));
    let expected = Contribution {
        pot_id: id.clone(),
        contributor: world.owner.clone(),
        amount: 250,
        balance: 250,
        reference_hash: hash(&world.env, 1),
    }
    .to_xdr(&world.env, &world.contract_id);
    assert!(world
        .env
        .events()
        .all()
        .events()
        .iter()
        .any(|event| event == &expected));

    assert_eq!(pot.balance, 250);
    assert_eq!(pot.total_deposited, 250);
    assert_eq!(pot.total_withdrawn, 0);
    assert_eq!(pot.contribution_count, 1);
    assert_eq!(pot.status, PotStatus::Active);
    assert_invariant(&pot);
    assert_eq!(token_balance(&world, &world.owner), before_owner - 250);
    assert_eq!(
        token_balance(&world, &world.contract_id),
        before_contract + 250
    );
    assert_eq!(client(&world).get_pot(&id).balance, 250);
}

#[test]
fn rejects_invalid_contribution_amount_and_reference() {
    let world = world();
    let id = client(&world).create_pot(&world.owner, &world.token, &10_000, &0);
    assert_contract_error(
        client(&world).try_contribute(&id, &world.owner, &0, &hash(&world.env, 1)),
        ContractError::InvalidAmount,
    );
    assert_contract_error(
        client(&world).try_contribute(&id, &world.owner, &-5, &hash(&world.env, 1)),
        ContractError::InvalidAmount,
    );
    assert_contract_error(
        client(&world).try_contribute(&id, &world.owner, &5, &zero_hash(&world.env)),
        ContractError::InvalidReference,
    );
    assert_eq!(token_balance(&world, &world.contract_id), 0);
}

#[test]
fn rejects_duplicate_reference_for_the_same_pot() {
    let world = world();
    let id = client(&world).create_pot(&world.owner, &world.token, &10_000, &0);
    let reference = hash(&world.env, 4);
    client(&world).contribute(&id, &world.owner, &10, &reference);
    assert_contract_error(
        client(&world).try_contribute(&id, &world.owner, &10, &reference),
        ContractError::DuplicateReference,
    );
    assert_eq!(client(&world).get_pot(&id).balance, 10);

    let other = client(&world).create_pot(&world.owner, &world.token, &10_000, &0);
    let pot = client(&world).contribute(&other, &world.owner, &10, &reference);
    assert_eq!(pot.balance, 10);
}

#[test]
fn reaches_goal_and_stays_contributable() {
    let world = world();
    let id = client(&world).create_pot(&world.owner, &world.token, &100, &0);
    let pot = client(&world).contribute(&id, &world.owner, &100, &hash(&world.env, 1));
    assert_eq!(pot.status, PotStatus::GoalReached);
    assert_invariant(&pot);

    let expected = GoalReachedEvent {
        pot_id: id.clone(),
        balance: 100,
        goal_amount: 100,
    }
    .to_xdr(&world.env, &world.contract_id);
    assert!(world
        .env
        .events()
        .all()
        .events()
        .iter()
        .any(|event| event == &expected));

    let later = client(&world).contribute(&id, &world.owner, &25, &hash(&world.env, 2));
    assert_eq!(later.status, PotStatus::GoalReached);
    assert_eq!(later.balance, 125);
    assert_eq!(later.contribution_count, 2);
    assert_invariant(&later);
}

#[test]
fn owner_withdraws_exact_amount_and_keeps_goal_status() {
    let world = world();
    let id = client(&world).create_pot(&world.owner, &world.token, &100, &0);
    client(&world).contribute(&id, &world.owner, &100, &hash(&world.env, 1));
    let before_owner = token_balance(&world, &world.owner);
    let before_contract = token_balance(&world, &world.contract_id);

    let pot = client(&world).withdraw(&id, &world.owner, &40);
    let expected = FundsWithdrawn {
        pot_id: id.clone(),
        owner: world.owner.clone(),
        amount: 40,
        balance: 60,
    }
    .to_xdr(&world.env, &world.contract_id);
    assert!(world
        .env
        .events()
        .all()
        .events()
        .iter()
        .any(|event| event == &expected));
    assert_eq!(pot.balance, 60);
    assert_eq!(pot.total_deposited, 100);
    assert_eq!(pot.total_withdrawn, 40);
    assert_eq!(pot.status, PotStatus::GoalReached);
    assert_invariant(&pot);
    assert_eq!(token_balance(&world, &world.owner), before_owner + 40);
    assert_eq!(
        token_balance(&world, &world.contract_id),
        before_contract - 40
    );
}

#[test]
fn rejects_early_non_owner_excess_and_invalid_withdrawals() {
    let world = world();
    let locked = client(&world).create_pot(&world.owner, &world.token, &500, &5_000);
    client(&world).contribute(&locked, &world.owner, &80, &hash(&world.env, 1));
    assert_contract_error(
        client(&world).try_withdraw(&locked, &world.owner, &10),
        ContractError::PotLocked,
    );

    world.env.ledger().with_mut(|info| {
        info.timestamp = 5_000;
    });
    let pot = client(&world).withdraw(&locked, &world.owner, &10);
    assert_eq!(pot.balance, 70);
    assert_invariant(&pot);

    let open = client(&world).create_pot(&world.owner, &world.token, &500, &0);
    client(&world).contribute(&open, &world.owner, &80, &hash(&world.env, 2));
    let stranger = Address::generate(&world.env);
    assert_contract_error(
        client(&world).try_withdraw(&open, &stranger, &10),
        ContractError::Unauthorized,
    );
    assert_contract_error(
        client(&world).try_withdraw(&open, &world.owner, &81),
        ContractError::InsufficientBalance,
    );
    assert_contract_error(
        client(&world).try_withdraw(&open, &world.owner, &0),
        ContractError::InvalidAmount,
    );
    assert_contract_error(
        client(&world).try_withdraw(&open, &world.owner, &-1),
        ContractError::InvalidAmount,
    );
    assert_eq!(client(&world).get_pot(&open).balance, 80);
    assert_eq!(token_balance(&world, &stranger), 0);
}

#[test]
fn withdrawal_destination_is_the_stored_owner() {
    let world = world();
    let contributor = Address::generate(&world.env);
    StellarAssetClient::new(&world.env, &world.token).mint(&contributor, &500);
    let id = client(&world).create_pot(&world.owner, &world.token, &500, &0);
    client(&world).contribute(&id, &contributor, &120, &hash(&world.env, 7));

    let owner_before = token_balance(&world, &world.owner);
    let contributor_before = token_balance(&world, &contributor);
    client(&world).withdraw(&id, &world.owner, &120);

    assert_eq!(token_balance(&world, &world.owner), owner_before + 120);
    assert_eq!(token_balance(&world, &contributor), contributor_before);
    assert_eq!(token_balance(&world, &world.contract_id), 0);
    assert_eq!(client(&world).get_pot(&id).balance, 0);
}

#[test]
fn closes_only_a_zero_balance_pot_and_blocks_later_contributions() {
    let world = world();
    let id = client(&world).create_pot(&world.owner, &world.token, &100, &0);
    client(&world).contribute(&id, &world.owner, &30, &hash(&world.env, 1));
    assert_contract_error(
        client(&world).try_close_pot(&id, &world.owner),
        ContractError::InvalidStatus,
    );

    client(&world).withdraw(&id, &world.owner, &30);
    let closed = client(&world).close_pot(&id, &world.owner);
    assert_eq!(closed.status, PotStatus::Closed);
    assert_eq!(closed.balance, 0);
    assert_invariant(&closed);

    let expected = PotClosed {
        pot_id: id.clone(),
        owner: world.owner.clone(),
    }
    .to_xdr(&world.env, &world.contract_id);
    assert!(world
        .env
        .events()
        .all()
        .events()
        .iter()
        .any(|event| event == &expected));

    assert_contract_error(
        client(&world).try_contribute(&id, &world.owner, &5, &hash(&world.env, 2)),
        ContractError::PotClosed,
    );
    assert_contract_error(
        client(&world).try_withdraw(&id, &world.owner, &1),
        ContractError::PotClosed,
    );
    assert_contract_error(
        client(&world).try_close_pot(&id, &world.owner),
        ContractError::PotClosed,
    );
    assert_eq!(token_balance(&world, &world.contract_id), 0);
}

#[test]
fn non_owner_cannot_close() {
    let world = world();
    let id = client(&world).create_pot(&world.owner, &world.token, &100, &0);
    let stranger = Address::generate(&world.env);
    assert_contract_error(
        client(&world).try_close_pot(&id, &stranger),
        ContractError::Unauthorized,
    );
    assert_eq!(client(&world).get_pot(&id).status, PotStatus::Active);
}

#[test]
fn invariant_holds_across_several_operations() {
    let world = world();
    let id = client(&world).create_pot(&world.owner, &world.token, &1_000, &0);
    let mut pot = client(&world).contribute(&id, &world.owner, &200, &hash(&world.env, 1));
    assert_invariant(&pot);
    pot = client(&world).contribute(&id, &world.owner, &900, &hash(&world.env, 2));
    assert_eq!(pot.status, PotStatus::GoalReached);
    assert_invariant(&pot);
    pot = client(&world).withdraw(&id, &world.owner, &150);
    assert_invariant(&pot);
    pot = client(&world).contribute(&id, &world.owner, &25, &hash(&world.env, 3));
    assert_invariant(&pot);
    assert_eq!(pot.contribution_count, 3);
    assert_eq!(pot.total_deposited, 1_125);
    assert_eq!(pot.total_withdrawn, 150);
    assert_eq!(pot.balance, 975);
    assert_eq!(token_balance(&world, &world.contract_id), pot.balance);
}
