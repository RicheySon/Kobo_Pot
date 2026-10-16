export class MoneyInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyInputError";
  }
}

const GHS_PATTERN = /^\d+(\.\d{1,2})?$/;
const RATE_PATTERN = /^\d+(\.\d{1,2})?$/;

/** Parse a GHS display string into integer pesewas. One cedi is 100 pesewas. */
export function parseGhsToPesewas(input: string): bigint {
  const trimmed = input.trim();
  if (!GHS_PATTERN.test(trimmed)) {
    throw new MoneyInputError(
      "Enter an amount in cedis, using digits and up to two decimal places.",
    );
  }
  const [whole, fraction = ""] = trimmed.split(".");
  const pesewas = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  return pesewas;
}

/** Parse a demonstration GHS-per-DUSD rate into integer pesewas per DUSD. */
export function parseRateToPesewas(input: string): bigint {
  const trimmed = input.trim();
  if (!RATE_PATTERN.test(trimmed)) {
    throw new MoneyInputError(
      "The demonstration rate must be a positive number with up to two decimal places.",
    );
  }
  const [whole, fraction = ""] = trimmed.split(".");
  const pesewas = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (pesewas <= 0n) {
    throw new MoneyInputError("The demonstration rate must be greater than zero.");
  }
  return pesewas;
}

export function formatPesewas(pesewas: bigint): string {
  const negative = pesewas < 0n;
  const absolute = negative ? -pesewas : pesewas;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole.toString()}.${fraction}`;
}

export function formatBaseUnits(amount: bigint, decimals: number): string {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new MoneyInputError("Token decimals are not valid.");
  }
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  const scale = 10n ** BigInt(decimals);
  const whole = absolute / scale;
  const fraction = (absolute % scale).toString().padStart(decimals, "0");
  const body = decimals === 0 ? whole.toString() : `${whole.toString()}.${fraction}`;
  return `${negative ? "-" : ""}${body}`;
}

/**
 * Convert pesewas into token base units at a GHS-per-token rate.
 * Rounds down so the approved amount is never larger than the displayed saving.
 */
export function pesewasToBaseUnits(
  pesewas: bigint,
  ratePesewasPerToken: bigint,
  decimals: number,
): bigint {
  if (pesewas < 0n) {
    throw new MoneyInputError("An amount cannot be negative.");
  }
  if (ratePesewasPerToken <= 0n) {
    throw new MoneyInputError("The demonstration rate must be greater than zero.");
  }
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new MoneyInputError("Token decimals are not valid.");
  }
  const scale = 10n ** BigInt(decimals);
  return (pesewas * scale) / ratePesewasPerToken;
}

/** Parse a token display amount into integer base units, without rounding. */
export function parseTokenAmount(input: string, decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new MoneyInputError("Token decimals are not valid.");
  }
  const trimmed = input.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new MoneyInputError("Enter a DUSD amount using digits and a decimal point.");
  }
  const [whole, fraction = ""] = trimmed.split(".");
  if (fraction.length > decimals) {
    throw new MoneyInputError(`DUSD supports up to ${decimals} decimal places.`);
  }
  const scale = 10n ** BigInt(decimals);
  const padded = fraction.padEnd(decimals, "0");
  const fractional = padded.length === 0 ? 0n : BigInt(padded);
  return BigInt(whole) * scale + fractional;
}

/** Reverse a rounded-down conversion for display. This figure is simulated. */
export function baseUnitsToPesewas(
  baseUnits: bigint,
  ratePesewasPerToken: bigint,
  decimals: number,
): bigint {
  if (baseUnits < 0n) {
    throw new MoneyInputError("An amount cannot be negative.");
  }
  if (ratePesewasPerToken <= 0n) {
    throw new MoneyInputError("The demonstration rate must be greater than zero.");
  }
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new MoneyInputError("Token decimals are not valid.");
  }
  const scale = 10n ** BigInt(decimals);
  return (baseUnits * ratePesewasPerToken) / scale;
}
