"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/field";
import { TxStatus } from "@/components/tx-status";
import { useWallet } from "@/hooks/wallet-provider";
import { buildCreatePot, readPotIdResult } from "@/lib/contract/client";
import { MoneyInputError, formatBaseUnits, formatPesewas, parseGhsToPesewas, parseRateToPesewas, pesewasToBaseUnits } from "@/lib/savings/money";
import { fixedSavingPesewas } from "@/lib/savings/calculations";
import { savePotMetadata } from "@/lib/storage/pots";
import { getPublicConfig } from "@/lib/stellar/config";
import { transactionExplorerUrl } from "@/lib/stellar/explorer";
import { TransactionFlowError, submitOperation, type TxPhase } from "@/lib/stellar/transactions";
import { categories, potFormSchema, type PotFormValues } from "@/lib/validation/schemas";

export function CreatePotForm() {
  const wallet = useWallet();
  const router = useRouter();
  const config = getPublicConfig();
  const [phase, setPhase] = useState<TxPhase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [technical, setTechnical] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  const form = useForm<PotFormValues>({
    resolver: zodResolver(potFormSchema),
    defaultValues: {
      goalName: "",
      category: "Airtime",
      goalAmount: "",
      rule: "fixed",
      fixedAmount: "1.00",
      interval: "5.00",
      unlockDate: "",
      note: "",
    },
  });

  const values = form.watch();
  const preview = useMemo(() => previewPot(values, config.demoGhsPerDusd, config.tokenDecimals), [values, config.demoGhsPerDusd, config.tokenDecimals]);

  async function onSubmit(input: PotFormValues) {
    setHash(null);
    setTechnical(null);
    if (!wallet.address) {
      setPhase("wallet_unavailable");
      setMessage("Connect a Testnet wallet before creating a pot.");
      return;
    }
    if (!preview.ok) {
      setPhase("contract_rejection");
      setMessage(preview.message);
      return;
    }
    try {
      const result = await submitOperation({
        publicKey: wallet.address,
        operation: buildCreatePot(wallet.address, preview.goalBaseUnits, preview.unlockAt),
        onPhase: setPhase,
      });
      const potId = readPotIdResult(result.returnValue);
      savePotMetadata({
        id: potId,
        goalName: input.goalName,
        category: input.category,
        note: input.note,
        rule: input.rule,
        fixedPesewas: input.rule === "fixed" ? preview.fixedPesewas?.toString() ?? null : null,
        intervalPesewas: input.rule === "round_up" ? preview.intervalPesewas?.toString() ?? null : null,
        goalPesewas: preview.goalPesewas.toString(),
        createdAt: new Date().toISOString(),
      });
      setHash(result.hash);
      setMessage("Your savings pot is on Testnet.");
      router.push(`/pot/${potId}`);
    } catch (error) {
      if (error instanceof TransactionFlowError) {
        setPhase(error.phase);
        setMessage(error.message);
        setTechnical(error.technical);
        return;
      }
      setPhase("network_failure");
      setMessage(error instanceof Error ? error.message : "The pot could not be created.");
    }
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <Field label="Goal name" error={form.formState.errors.goalName?.message}>
        <input className="text-input" {...form.register("goalName")} />
      </Field>
      <Field label="Category" error={form.formState.errors.category?.message}>
        <select className="text-input" {...form.register("category")}>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </Field>
      <Field label="Goal amount in GHS" hint="Shown in cedis. The on-chain goal is the simulated DUSD equivalent." error={form.formState.errors.goalAmount?.message}>
        <input className="text-input" inputMode="decimal" {...form.register("goalAmount")} />
      </Field>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Saving rule</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" value="fixed" {...form.register("rule")} />
          Fixed amount after each purchase
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" value="round_up" {...form.register("rule")} />
          Round up to the next interval
        </label>
      </fieldset>
      {values.rule === "fixed" ? (
        <Field label="Fixed saving in GHS" error={form.formState.errors.fixedAmount?.message}>
          <input className="text-input" inputMode="decimal" {...form.register("fixedAmount")} />
        </Field>
      ) : (
        <Field label="Round-up interval in GHS" hint="An exact multiple saves one full interval." error={form.formState.errors.interval?.message}>
          <input className="text-input" inputMode="decimal" {...form.register("interval")} />
        </Field>
      )}
      <Field label="Optional unlock date" hint="UTC midnight. Leave blank to keep the pot open." error={form.formState.errors.unlockDate?.message}>
        <input className="text-input" type="date" {...form.register("unlockDate")} />
      </Field>
      <Field label="Optional note" hint="Kept on this device only. It is not written on-chain." error={form.formState.errors.note?.message}>
        <textarea className="text-input min-h-24" {...form.register("note")} />
      </Field>
      <Review preview={preview} rate={config.demoGhsPerDusd} decimals={config.tokenDecimals} />
      <button className="primary-button" type="submit" disabled={phase === "preparing" || phase === "awaiting_signature" || phase === "submitting" || phase === "confirming"}>
        Approve pot creation
      </button>
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

function Review({
  preview,
  rate,
  decimals,
}: {
  preview: Preview;
  rate: string;
  decimals: number;
}) {
  return (
    <section className="rounded-3xl bg-cream-deep p-4 text-sm" aria-label="Summary before wallet approval">
      <h2 className="font-display text-xl">Review before approval</h2>
      {preview.ok ? (
        <ul className="mt-3 space-y-1">
          <li>Goal: GHS {formatPesewas(preview.goalPesewas)}</li>
          <li>On-chain goal: {formatBaseUnits(preview.goalBaseUnits, decimals)} DUSD</li>
          <li>Demonstration rate: {rate} GHS per DUSD</li>
          <li>{preview.ruleLabel}</li>
        </ul>
      ) : (
        <p className="mt-3 text-clay">{preview.message}</p>
      )}
    </section>
  );
}

type Preview =
  | {
      ok: true;
      goalPesewas: bigint;
      goalBaseUnits: bigint;
      unlockAt: bigint;
      fixedPesewas: bigint | null;
      intervalPesewas: bigint | null;
      ruleLabel: string;
    }
  | { ok: false; message: string };

function previewPot(values: PotFormValues, rate: string, decimals: number): Preview {
  try {
    const goalPesewas = parseGhsToPesewas(values.goalAmount || "0");
    if (goalPesewas <= 0n) {
      return { ok: false, message: "Enter a goal greater than zero." };
    }
    const goalBaseUnits = pesewasToBaseUnits(goalPesewas, parseRateToPesewas(rate), decimals);
    if (goalBaseUnits <= 0n) {
      return { ok: false, message: "That goal is smaller than one DUSD base unit at the demonstration rate." };
    }
    const unlockAt = unlockTimestamp(values.unlockDate);
    if (values.rule === "fixed") {
      const fixedPesewas = fixedSavingPesewas(parseGhsToPesewas(values.fixedAmount || "0"));
      return {
        ok: true,
        goalPesewas,
        goalBaseUnits,
        unlockAt,
        fixedPesewas,
        intervalPesewas: null,
        ruleLabel: `Fixed saving: GHS ${formatPesewas(fixedPesewas)} after each recorded purchase.`,
      };
    }
    const intervalPesewas = parseGhsToPesewas(values.interval || "0");
    if (intervalPesewas <= 0n) {
      return { ok: false, message: "Enter a round-up interval greater than zero." };
    }
    return {
      ok: true,
      goalPesewas,
      goalBaseUnits,
      unlockAt,
      fixedPesewas: null,
      intervalPesewas,
      ruleLabel: `Round up to the next GHS ${formatPesewas(intervalPesewas)}.`,
    };
  } catch (error) {
    const message = error instanceof MoneyInputError || error instanceof Error ? error.message : "Check the amounts.";
    return { ok: false, message };
  }
}

function unlockTimestamp(value: string): bigint {
  if (!value) {
    return 0n;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error("Choose a valid unlock date.");
  }
  const seconds = BigInt(Math.floor(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 1000));
  if (seconds <= BigInt(Math.floor(Date.now() / 1000))) {
    throw new Error("Choose an unlock date after today, or leave it open.");
  }
  return seconds;
}
