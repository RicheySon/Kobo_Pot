"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/field";
import { TxStatus } from "@/components/tx-status";
import { usePotMetadataList } from "@/hooks/local-records";
import { useWallet } from "@/hooks/wallet-provider";
import { buildClosePot, buildGetPot, buildWithdraw, readPotResult } from "@/lib/contract/client";
import { formatBaseUnits, parseTokenAmount } from "@/lib/savings/money";
import { getPublicConfig } from "@/lib/stellar/config";
import { transactionExplorerUrl } from "@/lib/stellar/explorer";
import {
  TransactionFlowError,
  simulateRead,
  submitOperation,
  type TxPhase,
} from "@/lib/stellar/transactions";
import { withdrawFormSchema, type WithdrawFormValues } from "@/lib/validation/schemas";
import type { SavingsPotView } from "@/lib/contract/parse";

export function WithdrawForm({ initialPotId }: { initialPotId?: string }) {
  const wallet = useWallet();
  const config = getPublicConfig();
  const pots = usePotMetadataList();
  const [onChain, setOnChain] = useState<SavingsPotView | null>(null);
  const [phase, setPhase] = useState<TxPhase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [technical, setTechnical] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawFormSchema),
    defaultValues: { potId: initialPotId ?? "", amount: "" },
  });
  const potId = form.watch("potId");

  useEffect(() => {
    if (form.getValues("potId") || !pots[0]) {
      return;
    }
    const timer = window.setTimeout(() => {
      if (!form.getValues("potId") && pots[0]) {
        form.setValue("potId", pots[0].id);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [form, pots]);

  useEffect(() => {
    if (!wallet.address || !potId) {
      return;
    }
    let cancelled = false;
    void simulateRead(wallet.address, buildGetPot(potId))
      .then((value) => {
        if (!cancelled) {
          setOnChain(readPotResult(value));
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setOnChain(null);
          setMessage(error instanceof Error ? error.message : "The pot could not be refreshed.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [wallet.address, potId, hash]);

  async function onSubmit(input: WithdrawFormValues) {
    await run(input.potId, async () => {
      if (!wallet.address || !onChain) {
        throw new TransactionFlowError("network_failure", "Refresh the pot before withdrawing.", "missing pot");
      }
      if (wallet.address !== onChain.owner) {
        throw new TransactionFlowError("contract_rejection", "Only the pot owner can withdraw.", "owner mismatch");
      }
      const amount = parseTokenAmount(input.amount, config.tokenDecimals);
      if (amount <= 0n) {
        throw new TransactionFlowError("contract_rejection", "Enter an amount greater than zero.", "zero");
      }
      return submitOperation({
        publicKey: wallet.address,
        operation: buildWithdraw(input.potId, wallet.address, amount),
        onPhase: setPhase,
      });
    });
  }

  async function closePot() {
    const id = form.getValues("potId");
    await run(id, async () => {
      if (!wallet.address) {
        throw new TransactionFlowError("wallet_unavailable", "Connect the owner wallet first.", "disconnected");
      }
      return submitOperation({
        publicKey: wallet.address,
        operation: buildClosePot(id, wallet.address),
        onPhase: setPhase,
      });
    });
  }

  async function run(
    id: string,
    action: () => Promise<{ hash: string; returnValue?: import("@stellar/stellar-sdk").xdr.ScVal }>,
  ) {
    setHash(null);
    setTechnical(null);
    if (!wallet.address) {
      setPhase("wallet_unavailable");
      setMessage("Connect a Testnet wallet before moving savings.");
      return;
    }
    try {
      const result = await action();
      if (result.returnValue) {
        setOnChain(readPotResult(result.returnValue));
      }
      setHash(result.hash);
      setMessage("The pot was updated from the confirmed transaction.");
      void id;
    } catch (error) {
      if (error instanceof TransactionFlowError) {
        setPhase(error.phase);
        setMessage(error.message);
        setTechnical(error.technical);
        return;
      }
      setPhase("network_failure");
      setMessage(error instanceof Error ? error.message : "The withdrawal could not be submitted.");
    }
  }

  const metadata = pots.find((pot) => pot.id === potId) ?? null;
  const locked = onChain ? onChain.unlockAt > 0n && BigInt(Math.floor(Date.now() / 1000)) < onChain.unlockAt : false;

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <Field label="Savings pot" error={form.formState.errors.potId?.message}>
        <select className="text-input" {...form.register("potId")}>
          <option value="">Choose a pot</option>
          {pots.map((pot) => (
            <option key={pot.id} value={pot.id}>
              {pot.goalName}
            </option>
          ))}
        </select>
      </Field>
      <section className="rounded-3xl bg-white p-4 text-sm">
        <h2 className="font-display text-xl">Eligibility</h2>
        {!wallet.address ? <p className="mt-2">Connect the owner wallet to read the on-chain balance.</p> : null}
        {onChain ? (
          <ul className="mt-2 space-y-1">
            <li>Available: {formatBaseUnits(onChain.balance, config.tokenDecimals)} DUSD</li>
            <li>Status: {onChain.status}</li>
            <li>{locked ? "This pot is still locked." : "This pot is not time-locked right now."}</li>
            <li>
              Destination: the stored owner wallet
              {wallet.address === onChain.owner ? " (this connected wallet)." : " (not this connected wallet)."}
            </li>
            {metadata ? <li>Goal name on this device: {metadata.goalName}</li> : null}
          </ul>
        ) : (
          <p className="mt-2">On-chain balance appears after the pot is read from Testnet.</p>
        )}
        <p className="mt-3">Withdrawing reduces the saved balance. Goal progress does not turn the pot back to active.</p>
      </section>
      <Field label="Amount in DUSD" hint="This demo token has no real monetary value." error={form.formState.errors.amount?.message}>
        <input className="text-input" inputMode="decimal" {...form.register("amount")} />
      </Field>
      <div className="flex flex-wrap gap-3">
        <button className="primary-button" type="submit">
          Withdraw to owner wallet
        </button>
        <button className="secondary-button" type="button" onClick={() => void closePot()}>
          Close empty pot
        </button>
      </div>
      <TxStatus
        phase={phase}
        message={message}
        technical={technical}
        hash={hash}
        explorerUrl={hash ? transactionExplorerUrl(config.explorerBaseUrl, hash) : null}
      />
    </form>
  );
}
