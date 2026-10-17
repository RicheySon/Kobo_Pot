"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ProgressBar } from "@/components/progress-bar";
import { usePotMetadataList, usePurchases } from "@/hooks/local-records";
import { useWallet } from "@/hooks/wallet-provider";
import { buildGetPot, readPotResult } from "@/lib/contract/client";
import type { SavingsPotView } from "@/lib/contract/parse";
import {
  baseUnitsToPesewas,
  formatBaseUnits,
  formatPesewas,
  parseRateToPesewas,
} from "@/lib/savings/money";
import { getPublicConfig } from "@/lib/stellar/config";
import { accountExplorerUrl, contractExplorerUrl, transactionExplorerUrl } from "@/lib/stellar/explorer";
import { simulateRead } from "@/lib/stellar/transactions";

export function PotDetail({ potId }: { potId: string }) {
  const wallet = useWallet();
  const config = getPublicConfig();
  const metadata = usePotMetadataList().find((pot) => pot.id === potId) ?? null;
  const purchases = usePurchases(potId);
  const [chain, setChain] = useState<SavingsPotView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet.address) {
      return;
    }
    let cancelled = false;
    void simulateRead(wallet.address, buildGetPot(potId))
      .then((value) => {
        if (!cancelled) {
          setChain(readPotResult(value));
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setChain(null);
          setError(caught instanceof Error ? caught.message : "The pot could not be read.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [wallet.address, potId]);

  const progress =
    chain && chain.goalAmount > 0n
      ? Number((chain.balance * 10_000n) / chain.goalAmount) / 100
      : 0;

  return (
    <article className="space-y-5 rounded-3xl bg-white p-6">
      <header>
        <h1 className="font-display text-4xl">{metadata?.goalName ?? "Savings pot"}</h1>
        <p className="mt-2 break-all text-sm text-ink/70">Pot id {potId}</p>
      </header>
      {metadata ? (
        <p className="text-sm">
          {metadata.category}. Saving rule: {metadata.rule === "fixed" ? "fixed amount" : "round up"}. This label is
          stored only in this browser.
        </p>
      ) : (
        <p className="text-sm">This browser does not have a local name for this pot. Chain data still loads when a wallet is connected.</p>
      )}
      {!wallet.address ? (
        <p role="status">Connect a Testnet wallet to read the on-chain balance.</p>
      ) : null}
      {error ? <p className="text-clay">{error}</p> : null}
      {chain ? (
        <div className="space-y-3">
          <ProgressBar value={progress} label="Goal progress from the chain" />
          <p>Status: {chain.status}</p>
          <p>Balance: {formatBaseUnits(chain.balance, config.tokenDecimals)} DUSD</p>
          <p>
            Simulated GHS equivalent:{" "}
            {formatPesewas(
              baseUnitsToPesewas(chain.balance, parseRateToPesewas(config.demoGhsPerDusd), config.tokenDecimals),
            )}
          </p>
          <p>Goal: {formatBaseUnits(chain.goalAmount, config.tokenDecimals)} DUSD</p>
          <p>Contributions: {chain.contributionCount.toString()}</p>
          <p>Owner: {chain.owner}</p>
          <p>
            <a className="text-pine-dark underline" href={accountExplorerUrl(config.explorerBaseUrl, chain.owner)}>
              Owner on the Testnet explorer
            </a>
          </p>
          <p>Unlock: {chain.unlockAt === 0n ? "Open" : new Date(Number(chain.unlockAt) * 1000).toUTCString()}</p>
        </div>
      ) : null}
      {config.contractId ? (
        <p>
          <a className="text-pine-dark underline" href={contractExplorerUrl(config.explorerBaseUrl, config.contractId)}>
            Contract on the Testnet explorer
          </a>
        </p>
      ) : null}
      {purchases.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {purchases.map((purchase) => (
            <li key={purchase.reference}>
              {purchase.description}: simulated GHS {formatPesewas(BigInt(purchase.purchasePesewas))}
              {purchase.transactionHash ? (
                <>
                  {" "}
                  <a
                    className="text-pine-dark underline"
                    href={transactionExplorerUrl(config.explorerBaseUrl, purchase.transactionHash)}
                  >
                    Testnet transaction
                  </a>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Link className="primary-button" href="/airtime">
          Buy airtime
        </Link>
        <Link className="secondary-button" href={`/purchase?pot=${potId}`}>
          Add savings
        </Link>
        <Link className="secondary-button" href={`/withdraw?pot=${potId}`}>
          Withdraw
        </Link>
        <Link className="secondary-button" href="/dashboard">
          Dashboard
        </Link>
      </div>
    </article>
  );
}
