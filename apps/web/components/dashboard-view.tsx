"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ProgressBar } from "@/components/progress-bar";
import { usePotMetadataList, usePurchases } from "@/hooks/local-records";
import { useWallet } from "@/hooks/wallet-provider";
import { buildGetPot, readPotResult } from "@/lib/contract/client";
import type { SavingsPotView } from "@/lib/contract/parse";
import { formatBaseUnits, formatPesewas, parseRateToPesewas, baseUnitsToPesewas } from "@/lib/savings/money";
import type { PotMetadata } from "@/lib/storage/pots";
import { getPublicConfig } from "@/lib/stellar/config";
import { simulateRead } from "@/lib/stellar/transactions";

type ChainState = {
  chain: SavingsPotView | null;
  error: string | null;
};

export function DashboardView() {
  const wallet = useWallet();
  const config = getPublicConfig();
  const metadata = usePotMetadataList();
  const [chains, setChains] = useState<Record<string, ChainState>>({});

  useEffect(() => {
    if (!wallet.address || metadata.length === 0) {
      return;
    }
    let cancelled = false;
    void Promise.all(
      metadata.map(async (item) => {
        try {
          const value = await simulateRead(wallet.address as string, buildGetPot(item.id));
          return [item.id, { chain: readPotResult(value), error: null }] as const;
        } catch (error) {
          return [
            item.id,
            {
              chain: null,
              error: error instanceof Error ? error.message : "The pot could not be read.",
            },
          ] as const;
        }
      }),
    ).then((entries) => {
      if (!cancelled) {
        setChains(Object.fromEntries(entries));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [wallet.address, metadata]);

  if (metadata.length === 0) {
    return (
      <section className="rounded-3xl bg-white p-6">
        <h2 className="font-display text-2xl">No pots on this device yet</h2>
        <p className="mt-2 text-sm">Create a savings pot to start. Local names help you navigate. Balances come from the contract.</p>
        <Link className="primary-button mt-4 inline-block" href="/pot/new">
          Create a pot
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {!wallet.address ? (
        <p className="rounded-2xl bg-white p-4 text-sm" role="status">
          Connect a Testnet wallet to refresh on-chain balances. Names below are stored only in this browser.
        </p>
      ) : null}
      {metadata.map((item) => (
        <PotCard
          key={item.id}
          metadata={item}
          chainState={chains[item.id] ?? null}
          decimals={config.tokenDecimals}
          rate={config.demoGhsPerDusd}
        />
      ))}
    </div>
  );
}

function PotCard({
  metadata,
  chainState,
  decimals,
  rate,
}: {
  metadata: PotMetadata;
  chainState: ChainState | null;
  decimals: number;
  rate: string;
}) {
  const purchases = usePurchases(metadata.id).slice(0, 3);
  const chain = chainState?.chain ?? null;
  const progress = progressPercent(chain);
  const simulated = chain
    ? formatPesewas(baseUnitsToPesewas(chain.balance, parseRateToPesewas(rate), decimals))
    : null;
  return (
    <article className="rounded-3xl bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">{metadata.goalName}</h2>
          <p className="text-sm text-ink/70">{metadata.category}</p>
        </div>
        <p className="rounded-full bg-cream px-3 py-1 text-sm">{chain?.status ?? "Not refreshed"}</p>
      </div>
      {chain ? (
        <div className="mt-4 space-y-3">
          <ProgressBar value={progress} label="Goal progress from the chain" />
          <p>On-chain balance: {formatBaseUnits(chain.balance, decimals)} DUSD</p>
          <p>Simulated GHS equivalent: {simulated}</p>
          <p>Remaining goal: {formatBaseUnits(remaining(chain), decimals)} DUSD</p>
          <p>Contributions: {chain.contributionCount.toString()}</p>
          <p>Unlock: {chain.unlockAt === 0n ? "Open" : new Date(Number(chain.unlockAt) * 1000).toUTCString()}</p>
        </div>
      ) : (
        <p className="mt-4 text-sm">{chainState?.error ?? "Connect a wallet to read this pot from Testnet."}</p>
      )}
      {purchases.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm">
          {purchases.map((purchase) => (
            <li key={purchase.reference}>
              {purchase.description}: simulated GHS {formatPesewas(BigInt(purchase.purchasePesewas))}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link className="primary-button" href={`/purchase?pot=${metadata.id}`}>
          Add savings
        </Link>
        <Link className="secondary-button" href={`/withdraw?pot=${metadata.id}`}>
          Withdraw
        </Link>
        <Link className="secondary-button" href={`/pot/${metadata.id}`}>
          Pot details
        </Link>
      </div>
    </article>
  );
}

function progressPercent(pot: SavingsPotView | null): number {
  if (!pot || pot.goalAmount <= 0n) {
    return 0;
  }
  const ratio = Number((pot.balance * 10_000n) / pot.goalAmount) / 100;
  return ratio;
}

function remaining(pot: SavingsPotView): bigint {
  return pot.balance >= pot.goalAmount ? 0n : pot.goalAmount - pot.balance;
}
