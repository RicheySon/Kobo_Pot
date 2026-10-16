export const CONTRACT_ERROR_MESSAGES: Record<number, string> = {
  1: "That savings pot could not be found on Testnet.",
  2: "The goal must be greater than zero.",
  3: "The amount must be greater than zero.",
  4: "The unlock time must be left open, or set in the future.",
  5: "This savings pot is closed.",
  6: "This purchase reference was already used for this pot.",
  7: "Only the pot owner can do that.",
  8: "The pot does not have enough saved for that amount.",
  9: "This pot is still locked.",
  10: "The amount could not be calculated safely.",
  11: "The purchase reference is not valid.",
  12: "A pot can close only when its balance is zero.",
};

export function contractErrorMessage(code: number): string {
  return CONTRACT_ERROR_MESSAGES[code] ?? "The savings pot rejected this transaction.";
}

export function contractErrorCodeFromMessage(message: string): number | null {
  const match = message.match(/Error\(Contract,\s*#(\d+)\)/) ?? message.match(/contract error #(\d+)/i);
  if (!match) {
    return null;
  }
  return Number(match[1]);
}
