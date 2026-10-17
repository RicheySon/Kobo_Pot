import { describe, expect, it } from "vitest";

import { airtimeDescription, createDummyAirtimeOrder, findAirtimeBundle, parseGhanaPhone } from "@/lib/savings/airtime";

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

  it("creates a dummy order that does not represent a real payment", () => {
    const order = createDummyAirtimeOrder({
      network: "Telecel",
      bundleId: "ghs-5",
      phone: "0244123456",
      now: new Date("2026-10-17T14:00:00.000Z"),
      id: "abc12345",
    });
    expect(order).toEqual({
      id: "DUMMY-20261017-abc12345",
      network: "Telecel",
      phone: "0244123456",
      ghs: "5.00",
      createdAt: "2026-10-17T14:00:00.000Z",
    });
    expect(() => createDummyAirtimeOrder({ network: "MTN", bundleId: "ghs-5", phone: "123" })).toThrow(/Ghana/);
  });
});
