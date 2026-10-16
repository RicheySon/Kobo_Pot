"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/field";
import { TxStatus } from "@/components/tx-status";
import { usePotMetadataList } from "@/hooks/local-records";
import { useWallet } from "@/hooks/wallet-provider";
import { buildContribute, readPotResult } from "@/lib/contract/client";
import { savingPesewas } from "@/lib/savings/calculations";
import {
  MoneyInputError,
  baseUnitsToPesewas,
  formatBaseUnits,
  formatPesewas,
  parseGhsToPesewas,
  parseRateToPesewas,
  pesewasToBaseUnits,
} from "@/lib/savings/money";
import { createSandboxReference, isSandboxReference, sha256Hex } from "@/lib/savings/reference";
import { savePurchase, type PotMetadata } from "@/lib/storage/pots";
import { getPublicConfig } from "@/lib/stellar/config";
import { transactionExplorerUrl } from "@/lib/stellar/explorer";
import { TransactionFlowError, submitOperation, type TxPhase } from "@/lib/stellar/transactions";
import { categories, purchaseFormSchema, type PurchaseFormValues } from "@/lib/validation/schemas";

export function PurchaseForm({ initialPotId }: { initialPotId?: string }) {
  const wallet = useWallet();
  const config = getPublicConfig();
  const pots = usePotMetadataList();
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<TxPhase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [technical, setTechnical] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      potId: initialPotId ?? "",
      category: "Airtime",
      description: "Airtime",
      amount: "10.00",
      reference: "",
      purchasedOn: new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    if (ready) {
      return;
    }
    const timer = window.setTimeout(() => {
      if (!form.getValues("reference")) {
        form.setValue("reference", createSandboxReference());
      }
      if (!form.getValues("potId") && pots[0]) {
        form.setValue("potId", pots[0].id);
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [form, pots, ready]);

  const values = form.watch();
  const selected = pots.find((pot) => pot.id === values.potId) ?? null;
  const preview = useMemo(
    () => previewPurchase(values, selected, config.demoGhsPerDusd, config.tokenDecimals),
    [values, selected, config.demoGhsPerDusd, config.tokenDecimals],
  );

  async function onSubmit(input: PurchaseFormValues) {
    setHash(null);
    setTechnical(null);
    setBalance(null);
    if (!wallet.address) {
      setPhase("wallet_unavailable");
      setMessage("Connect a Testnet wallet before adding to savings.");
      return;
    }
    if (!selected || !preview.ok) {
      setPhase("contract_rejection");
      setMessage(preview.ok ? "Choose a savings pot saved on this device." : preview.message);
      return;
    }
    try {
      const referenceHash = await sha256Hex(input.reference.trim());
      const result = await submitOperation({
        publicKey: wallet.address,
        operation: buildContribute(selected.id, wallet.address, preview.dusdBaseUnits, referenceHash),
        onPhase: setPhase,
      });
      const pot = readPotResult(result.returnValue);
      savePurchase({
        potId: selected.id,
        category: input.category,
        description: input.description,
        purchasePesewas: preview.purchasePesewas.toString(),
        savingPesewas: preview.savingPesewas.toString(),
        rate: config.demoGhsPerDusd,
        dusdBaseUnits: preview.dusdBaseUnits.toString(),
        reference: input.reference.trim(),
        purchasedAt: input.purchasedOn,
        transactionHash: result.hash,
      });
      setHash(result.hash);
      setBalance(formatBaseUnits(pot.balance, config.tokenDecimals));
      setMessage("DUSD is now in the savings pot. The balance below was read from the contract result.");
      form.setValue("reference", createSandboxReference());
    } catch (error) {
      if (error instanceof TransactionFlowError) {
        setPhase(error.phase);
        setMessage(error.message);
        setTechnical(error.technical);
        return;
      }
      setPhase("network_failure");
      setMessage(error instanceof Error ? error.message : "The contribution could not be submitted.");
    }
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <p className="rounded-2xl bg-white p-4 text-sm">
        This purchase is simulated Mobile Money activity. Nothing is debited from a real wallet until you approve the separate Testnet DUSD contribution.
      </p>
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
      <Field label="Category" error={form.formState.errors.category?.message}>
        <select className="text-input" {...form.register("category")}>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </Field>
      <Field label="Description" error={form.formState.errors.description?.message}>
        <input className="text-input" {...form.register("description")} />
      </Field>
      <Field label="Purchase amount in GHS" error={form.formState.errors.amount?.message}>
        <input className="text-input" inputMode="decimal" {...form.register("amount")} />
      </Field>
      <Field label="Sandbox reference" hint="Editable, then hashed before it is stored on-chain." error={form.formState.errors.reference?.message}>
        <input className="text-input" {...form.register("reference")} />
      </Field>
      <Field label="Purchase date" error={form.formState.errors.purchasedOn?.message}>
        <input className="text-input" type="date" {...form.register("purchasedOn")} />
      </Field>
      <section className="rounded-3xl bg-cream-deep p-4 text-sm" aria-label="Calculated saving">
        <h2 className="font-display text-xl">Calculated saving</h2>
        {preview.ok ? (
          <ul className="mt-3 space-y-1">
            <li>Purchase: GHS {formatPesewas(preview.purchasePesewas)}</li>
            <li>Rule: {preview.ruleLabel}</li>
            <li>Saving: GHS {formatPesewas(preview.savingPesewas)}</li>
            <li>Simulated rate: {config.demoGhsPerDusd} GHS per DUSD</li>
            <li>DUSD base units to approve: {preview.dusdBaseUnits.toString()}</li>
            <li>Displayed DUSD: {formatBaseUnits(preview.dusdBaseUnits, config.tokenDecimals)}</li>
          </ul>
        ) : (
          <p className="mt-3 text-clay">{preview.message}</p>
        )}
      </section>
      <button className="primary-button" type="submit">
        Approve contribution
      </button>
      {balance ? <p role="status">On-chain balance: {balance} DUSD</p> : null}
      <TxStatus
        phase={phase}
        message={message}
        technical={technical}
        hash={hash}
        explorerUrl={hash ? transactionExplorerUrl(config.explorerBaseUrl, hash) : null}
      />
      {!isSandboxReference(values.reference) && values.reference ? (
        <p className="text-sm text-clay">References look like KBP-YYYYMMDD- followed by an id.</p>
      ) : null}
    </form>
  );
}

type PurchasePreview =
  | {
      ok: true;
      purchasePesewas: bigint;
      savingPesewas: bigint;
      dusdBaseUnits: bigint;
      ruleLabel: string;
    }
  | { ok: false; message: string };

function previewPurchase(
  values: PurchaseFormValues,
  pot: PotMetadata | null,
  rate: string,
  decimals: number,
): PurchasePreview {
  if (!pot) {
    return { ok: false, message: "Create a pot on this device before recording a purchase." };
  }
  try {
    const purchasePesewas = parseGhsToPesewas(values.amount || "0");
    const saved = savingPesewas({
      rule: pot.rule,
      purchasePesewas,
      fixedPesewas: pot.fixedPesewas ? BigInt(pot.fixedPesewas) : undefined,
      intervalPesewas: pot.intervalPesewas ? BigInt(pot.intervalPesewas) : undefined,
    });
    const dusdBaseUnits = pesewasToBaseUnits(saved, parseRateToPesewas(rate), decimals);
    if (dusdBaseUnits <= 0n) {
      return { ok: false, message: "That saving rounds down to zero DUSD base units. Increase the saving or interval." };
    }
    const ruleLabel =
      pot.rule === "fixed"
        ? `Fixed GHS ${formatPesewas(saved)}`
        : `Round up, saving GHS ${formatPesewas(saved)}`;
    return { ok: true, purchasePesewas, savingPesewas: saved, dusdBaseUnits, ruleLabel };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof MoneyInputError || error instanceof Error ? error.message : "Check the purchase.",
    };
  }
}

export function simulatedGhs(baseUnits: bigint, rate: string, decimals: number): string {
  return formatPesewas(baseUnitsToPesewas(baseUnits, parseRateToPesewas(rate), decimals));
}
