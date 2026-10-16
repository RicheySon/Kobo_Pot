use soroban_sdk::contracterror;

/// Stable numeric codes. The frontend maps these exact values.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ContractError {
    PotNotFound = 1,
    InvalidGoal = 2,
    InvalidAmount = 3,
    InvalidUnlockTime = 4,
    PotClosed = 5,
    DuplicateReference = 6,
    Unauthorized = 7,
    InsufficientBalance = 8,
    PotLocked = 9,
    ArithmeticError = 10,
    InvalidReference = 11,
    /// Close was requested while the pot still holds a balance.
    InvalidStatus = 12,
}
