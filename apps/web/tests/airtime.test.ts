import { describe, expect, it } from "vitest";

import { airtimeDescription, findAirtimeBundle, parseGhanaPhone } from "@/lib/savings/airtime";

describe("simulated airtime", () => {
  it("lists fixed demo bundles in pesewas", () => {
    expect(findAirtimeBundle("ghs-10")?.pesewas).toBe(1000n);
    expect(findAirtimeBundle("ghs-2")?.ghs).toBe("2.00");
    expect(findAirtimeBundle("missing")).toBeNull();
  });

  it("accepts a local or 233 Ghana number", () => {
    expect(parseGhanaPhone("024 412 3456")).toBe("0244123456");
    expect(parseGhanaPhone("233244123456")).toBe("0244123456");
    expect(parseGhanaPhone("12345")).toBeNull();
    expect(parseGhanaPhone("024412345")).toBeNull();
  });

  it("describes the simulated purchase without claiming airtime was sent", () => {
    expect(airtimeDescription("MTN", "10.00", "0244123456")).toBe("MTN airtime GHS 10.00 for 024 412 3456");
  });
});
