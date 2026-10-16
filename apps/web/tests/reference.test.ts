import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { createSandboxReference, hexToBytes, isSandboxReference, sha256Hex } from "@/lib/savings/reference";

describe("sandbox references", () => {
  it("builds a dated reference and accepts only that shape", () => {
    const reference = createSandboxReference(
      new Date("2026-10-16T12:00:00Z"),
      "11111111-2222-4333-8444-555555555555",
    );
    expect(reference).toBe("KBP-20261016-11111111-2222-4333-8444-555555555555");
    expect(isSandboxReference(reference)).toBe(true);
    expect(isSandboxReference("purchase-1")).toBe(false);
  });

  it("hashes the reference with SHA-256 before it can be submitted", async () => {
    const reference = "KBP-20261016-11111111-2222-4333-8444-555555555555";
    const expected = createHash("sha256").update(reference).digest("hex");
    const hex = await sha256Hex(reference);
    expect(hex).toBe(expected);
    expect(hexToBytes(hex)).toEqual(Uint8Array.from(Buffer.from(expected, "hex")));
    expect(() => hexToBytes("abcd")).toThrow(/32 bytes/);
  });
});
