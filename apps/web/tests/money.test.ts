import { describe, expect, it } from "vitest";

import {
  baseUnitsToPesewas,
  formatBaseUnits,
  formatPesewas,
  parseGhsToPesewas,
  parseRateToPesewas,
  parseTokenAmount,
  pesewasToBaseUnits,
} from "@/lib/savings/money";

describe("money", () => {
  it("parses cedis into pesewas", () => {
    expect(parseGhsToPesewas("1")).toBe(100n);
    expect(parseGhsToPesewas("1.5")).toBe(150n);
    expect(parseGhsToPesewas("12.00")).toBe(1200n);
  });

  it("rejects extra fraction digits and blank amounts", () => {
    expect(() => parseGhsToPesewas("1.234")).toThrow(/two decimal places/);
    expect(() => parseGhsToPesewas("")).toThrow(/cedis/);
  });

  it("rejects a zero or invalid demonstration rate", () => {
    expect(() => parseRateToPesewas("0")).toThrow(/greater than zero/);
    expect(() => parseRateToPesewas("0.00")).toThrow(/greater than zero/);
    expect(() => parseRateToPesewas("twelve")).toThrow(/demonstration rate/);
  });

  it("rounds one cedi at 12.00 GHS per DUSD down to 833333 base units", () => {
    const base = pesewasToBaseUnits(100n, parseRateToPesewas("12.00"), 7);
    expect(base).toBe(833333n);
    expect(formatBaseUnits(base, 7)).toBe("0.0833333");
  });

  it("never rounds a conversion up", () => {
    expect(pesewasToBaseUnits(1n, 3n, 0)).toBe(0n);
  });

  it("parses token amounts without rounding", () => {
    expect(parseTokenAmount("1.25", 7)).toBe(12_500_000n);
    expect(() => parseTokenAmount("1.12345678", 7)).toThrow(/decimal places/);
  });

  it("formats pesewas and reverses a rounded conversion for display", () => {
    expect(formatPesewas(300n)).toBe("3.00");
    expect(baseUnitsToPesewas(833333n, 1200n, 7)).toBe(99n);
  });
});
