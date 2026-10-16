use soroban_sdk::{contractevent, Address, BytesN};

#[contractevent]
pub struct PotCreated {
    #[topic]
    pub pot_id: BytesN<32>,
    #[topic]
    pub owner: Address,
    pub token: Address,
    pub goal_amount: i128,
    pub unlock_at: u64,
}

#[contractevent]
pub struct Contribution {
    #[topic]
    pub pot_id: BytesN<32>,
    #[topic]
    pub contributor: Address,
    pub amount: i128,
    pub balance: i128,
    pub reference_hash: BytesN<32>,
}

#[contractevent]
pub struct GoalReachedEvent {
    #[topic]
    pub pot_id: BytesN<32>,
    pub balance: i128,
    pub goal_amount: i128,
}

#[contractevent]
pub struct FundsWithdrawn {
    #[topic]
    pub pot_id: BytesN<32>,
    #[topic]
    pub owner: Address,
    pub amount: i128,
    pub balance: i128,
}

#[contractevent]
pub struct PotClosed {
    #[topic]
    pub pot_id: BytesN<32>,
    #[topic]
    pub owner: Address,
}
