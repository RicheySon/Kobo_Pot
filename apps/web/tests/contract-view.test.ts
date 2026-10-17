import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { contractErrorCodeFromMessage, contractErrorMessage } from "@/lib/contract/errors";
import { parsePotStatus, parseSavingsPot } from "@/lib/contract/parse";
import { accountExplorerUrl, contractExplorerUrl, transactionExplorerUrl } from "@/lib/stellar/explorer";
import { assertConfigured, loadPublicConfig } from "@/lib/stellar/config";

const BASE = "https://stellar.expert/explorer/testnet";

describe("contract views", () => {
  it("maps stable contract error codes", () => {
    expect(contractErrorCodeFromMessage("Error(Contract, #6)")).toBe(6);
    expect(contractErrorCodeFromMessage("host rejected contract error #9")).toBe(9);
    expect(contractErrorCodeFromMessage("network down")).toBeNull();
    expect(contractErrorMessage(7)).toMatch(/owner/);
    expect(contractErrorMessage(12)).toMatch(/zero/);
  });

  it("parses pot status shapes returned by the SDK", () => {
    expect(parsePotStatus("GoalReached")).toBe("GoalReached");
    expect(parsePotStatus(["Closed"])).toBe("Closed");
    expect(parsePotStatus({ tag: "Active" })).toBe("Active");
    expect(parsePotStatus({ GoalReached: null })).toBe("GoalReached");
  });

  it("parses a savings pot with mixed numeric fields", () => {
    const pot = parseSavingsPot({
      id: "ab".repeat(32),
      owner: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      token: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
      goal_amount: "10000000",
      balance: 10n,
      total_deposited: 10,
      total_withdrawn: "0",
      contribution_count: "2",
      created_at: 1000n,
      unlock_at: 0n,
      status: { tag: "Active" },
    });
    expect(pot.balance).toBe(10n);
    expect(pot.goalAmount).toBe(10_000_000n);
    expect(pot.contributionCount).toBe(2n);
    expect(pot.status).toBe("Active");
  });

  it("builds Testnet explorer links and rejects other networks", () => {
    expect(contractExplorerUrl(BASE, "CABC")).toBe(`${BASE}/contract/CABC`);
    expect(transactionExplorerUrl(`${BASE}/`, "hash")).toBe(`${BASE}/tx/hash`);
    expect(accountExplorerUrl(BASE, "GABC")).toBe(`${BASE}/account/GABC`);
    expect(() => transactionExplorerUrl("https://stellar.expert/explorer/public", "hash")).toThrow(/Testnet/);
  });

  it("accepts the sandbox defaults and rejects mainnet settings", () => {
    const config = loadPublicConfig({});
    expect(config.network).toBe("testnet");
    expect(config.demoMode).toBe(true);
    expect(config.contractId).toBe("");
    assertConfigured(config);
    expect(() => loadPublicConfig({ NEXT_PUBLIC_STELLAR_NETWORK: "mainnet" })).toThrow();
    expect(() => loadPublicConfig({ NEXT_PUBLIC_APP_NAME: "Cheque" })).toThrow();
    expect(() => loadPublicConfig({ NEXT_PUBLIC_TOKEN_SYMBOL: "USDC" })).toThrow();
    expect(() => loadPublicConfig({ NEXT_PUBLIC_DEMO_MODE: "false" })).toThrow();
    expect(() =>
      assertConfigured({
        ...config,
        explorerBaseUrl: "https://stellar.expert/explorer/public",
      }),
    ).toThrow(/Testnet/);
    expect(() => assertConfigured({ ...config, contractId: "not-a-contract" })).toThrow(/contract ID/);
  });

  it("exposes contract ids through static public env access", () => {
    const source = readFileSync(new URL("../lib/stellar/config.ts", import.meta.url), "utf8");
    expect(source).toContain("process.env.NEXT_PUBLIC_CONTRACT_ID");
    expect(source).toContain("process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ID");
    expect(source).not.toContain('read(process.env, "NEXT_PUBLIC_CONTRACT_ID"');
  });
});
