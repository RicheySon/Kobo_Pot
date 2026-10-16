import { describe, expect, it } from "vitest";

import { fixedSavingPesewas, roundUpSavingPesewas, savingPesewas } from "@/lib/savings/calculations";
import { parseGhsToPesewas } from "@/lib/savings/money";

describe("saving rules", () => {
  it("keeps a fixed saving", () => {
    expect(fixedSavingPesewas(100n)).toBe(100n);
  });

  it("rejects a zero fixed saving", () => {
    expect(() => fixedSavingPesewas(0n)).toThrow(/greater than zero/);
  });

  it("saves the remainder up to the next interval", () => {
    const purchase = parseGhsToPesewas("17.00");
    const interval = parseGhsToPesewas("5.00");
    expect(roundUpSavingPesewas(purchase, interval)).toBe(parseGhsToPesewas("3.00"));
  });

  it("saves one full interval when the purchase is an exact multiple", () => {
    const purchase = parseGhsToPesewas("10.00");
    const interval = parseGhsToPesewas("5.00");
    expect(roundUpSavingPesewas(purchase, interval)).toBe(parseGhsToPesewas("5.00"));
  });

  it("selects the configured rule", () => {
    expect(
      savingPesewas({
        rule: "fixed",
        purchasePesewas: 1700n,
        fixedPesewas: 250n,
      }),
    ).toBe(250n);
    expect(
      savingPesewas({
        rule: "round_up",
        purchasePesewas: 1700n,
        intervalPesewas: 500n,
      }),
    ).toBe(300n);
  });
});
