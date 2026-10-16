import { MoneyInputError } from "./money";

export type SavingRule = "fixed" | "round_up";

export class SavingsRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SavingsRuleError";
  }
}

export function fixedSavingPesewas(configuredPesewas: bigint): bigint {
  if (configuredPesewas <= 0n) {
    throw new SavingsRuleError("A fixed saving must be greater than zero.");
  }
  return configuredPesewas;
}

/**
 * Round a purchase up to the next interval.
 * An exact multiple saves one full interval, matching the sandbox rule.
 */
export function roundUpSavingPesewas(purchasePesewas: bigint, intervalPesewas: bigint): bigint {
  if (purchasePesewas <= 0n) {
    throw new SavingsRuleError("A purchase amount must be greater than zero.");
  }
  if (intervalPesewas <= 0n) {
    throw new SavingsRuleError("A round-up interval must be greater than zero.");
  }
  const remainder = purchasePesewas % intervalPesewas;
  if (remainder === 0n) {
    return intervalPesewas;
  }
  return intervalPesewas - remainder;
}

export function savingPesewas(input: {
  rule: SavingRule;
  purchasePesewas: bigint;
  fixedPesewas?: bigint;
  intervalPesewas?: bigint;
}): bigint {
  if (input.rule === "fixed") {
    if (input.fixedPesewas === undefined) {
      throw new SavingsRuleError("Choose a fixed saving amount.");
    }
    return fixedSavingPesewas(input.fixedPesewas);
  }
  if (input.intervalPesewas === undefined) {
    throw new SavingsRuleError("Choose a round-up interval.");
  }
  return roundUpSavingPesewas(input.purchasePesewas, input.intervalPesewas);
}

export function assertPositivePesewas(value: bigint, label: string): void {
  if (value <= 0n) {
    throw new MoneyInputError(`${label} must be greater than zero.`);
  }
}
