use soroban_sdk::{contracttype, Address, BytesN};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PotStatus {
    Active,
    GoalReached,
    Closed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SavingsPot {
    pub id: BytesN<32>,
    pub owner: Address,
    pub token: Address,
    pub goal_amount: i128,
    pub balance: i128,
    pub total_deposited: i128,
    pub total_withdrawn: i128,
    pub contribution_count: u64,
    pub created_at: u64,
    pub unlock_at: u64,
    pub status: PotStatus,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Pot(BytesN<32>),
    OwnerNonce(Address),
    ProcessedReference(BytesN<32>, BytesN<32>),
}
