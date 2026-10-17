"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { Field } from "@/components/field";
import { TxStatus } from "@/components/tx-status";
import { usePotMetadataList } from "@/hooks/local-records";
import { useWallet } from "@/hooks/wallet-provider";
import { buildContribute, readPotResult } from "@/lib/contract/client";
import {
  airtimeBundles,
  airtimeDescription,
  airtimeNetworks,
  findAirtimeBundle,
  maskPhone,
  parseGhanaPhone,
  type AirtimeBundleId,
  type AirtimeNetwork,
} from "@/lib/savings/airtime";
import { savingPesewas } from "@/lib/savings/calculations";
import {
  MoneyInputError,
  formatBaseUnits,
  formatPesewas,
  parseRateToPesewas,
  pesewasToBaseUnits,
} from "@/lib/savings/money";
import { createSandboxReference, sha256Hex } from "@/lib/savings/reference";
import { savePurchase, type PotMetadata } from "@/lib/storage/pots";
import { getPublicConfig } from "@/lib/stellar/config";
import { transactionExplorerUrl } from "@/lib/stellar/explorer";
import { TransactionFlowError, phaseLabel, submitOperation, type TxPhase } from "@/lib/stellar/transactions";

export function AirtimeDemo() {
  const wallet = useWallet();
  const config = getPublicConfig();
  const pots = usePotMetadataList();
  const initialPotId = useSearchParams().get("pot") ?? "";
  const [potId, setPotId] = useState(initialPotId);
  const [network, setNetwork] = useState<AirtimeNetwork>("MTN");
  const [bundleId, setBundleId] = useState<AirtimeBundleId>("ghs-10");
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<TxPhase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [technical, setTechnical] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  const bundle = findAirtimeBundle(bundleId);
  const activePotId = pots.some((pot) => pot.id === potId) ? potId : (pots[0]?.id ?? "");
  const selected = pots.find((pot) => pot.id === activePotId) ?? null;
  const parsedPhone = parseGhanaPhone(phone);
  const preview = useMemo(
    () => previewAirtime(bundle?.pesewas ?? null, selected, config.demoGhsPerDusd, config.tokenDecimals),
    [bundle, selected, config.demoGhsPerDusd, config.tokenDecimals],
  );
  const busy =
    wallet.busy ||
    phase === "preparing" ||
    phase === "awaiting_signature" ||
    phase === "submitting" ||
    phase === "confirming";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHash(null);
    setTechnical(null);
    if (!parsedPhone || !bundle) {
      setPhase("contract_rejection");
      setMessage("Enter a Ghana mobile number, like 0244123456.");
      return;
    }
    if (!selected || !preview.ok) {
      setPhase("contract_rejection");
      setMessage(preview.ok ? "Choose a savings pot saved on this device." : preview.message);
      return;
    }
    let address = wallet.address;
    if (!address) {
      setPhase("awaiting_signature");
      setMessage("Choose a Testnet wallet to approve this simulated saving.");
      address = await wallet.connect();
      if (!address) {
        setPhase("wallet_unavailable");
        setMessage("Connect a Testnet wallet before approving the saving.");
        return;
      }
    }
    const reference = createSandboxReference();
    try {
      const referenceHash = await sha256Hex(reference);
      const result = await submitOperation({
        publicKey: address,
        operation: buildContribute(selected.id, address, preview.dusdBaseUnits, referenceHash),
        onPhase: setPhase,
      });
      const pot = readPotResult(result.returnValue);
      savePurchase({
        potId: selected.id,
        category: "Airtime",
        description: airtimeDescription(network, bundle.ghs, parsedPhone),
        purchasePesewas: preview.purchasePesewas.toString(),
        savingPesewas: preview.savingPesewas.toString(),
        rate: config.demoGhsPerDusd,
        dusdBaseUnits: preview.dusdBaseUnits.toString(),
        reference,
        purchasedAt: new Date().toISOString().slice(0, 10),
        transactionHash: result.hash,
      });
      setHash(result.hash);
      setMessage(
        `Simulated receipt saved. No airtime was sent. The pot balance is now ${formatBaseUnits(pot.balance, config.tokenDecimals)} DUSD.`,
      );
    } catch (error) {
      if (error instanceof TransactionFlowError) {
        setPhase(error.phase);
        setMessage(error.message);
        setTechnical(error.technical);
        return;
      }
      setPhase("network_failure");
      setMessage(error instanceof Error ? error.message : "The simulated saving could not be submitted.");
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      <p className="rounded-2xl bg-white p-4 text-sm">
        No airtime is delivered. The phone number stays in this browser. Approving the button moves sandbox DUSD into
        the pot on Stellar Testnet.
      </p>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Network</legend>
        <div className="flex flex-wrap gap-2">
          {airtimeNetworks.map((item) => (
            <button
              key={item}
              type="button"
              className={item === network ? "primary-button" : "secondary-button"}
              aria-pressed={item === network}
              onClick={() => setNetwork(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Airtime amount</legend>
        <div className="flex flex-wrap gap-2">
          {airtimeBundles.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === bundleId ? "primary-button" : "secondary-button"}
              aria-pressed={item.id === bundleId}
              onClick={() => setBundleId(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>
      <Field label="Mobile number" hint="A Ghana number for the simulated receipt only." error={phone && !parsedPhone ? "Use 10 digits starting with 0." : undefined}>
        <input
          className="text-input"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0244123456"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </Field>
      <Field label="Savings pot">
        <select className="text-input" value={activePotId} onChange={(event) => setPotId(event.target.value)}>
          <option value="">Choose a pot</option>
          {pots.map((pot) => (
            <option key={pot.id} value={pot.id}>
              {pot.goalName}
            </option>
          ))}
        </select>
      </Field>
      <Receipt
        network={network}
        phone={parsedPhone ? maskPhone(parsedPhone) : "Enter a mobile number"}
        airtime={bundle ? `GHS ${bundle.ghs}` : ""}
        preview={preview}
        rate={config.demoGhsPerDusd}
        decimals={config.tokenDecimals}
      />
      <TxStatus
        phase={phase}
        message={message}
        technical={technical}
        hash={hash}
        explorerUrl={hash ? transactionExplorerUrl(config.explorerBaseUrl, hash) : null}
      />
      <button className="primary-button" type="submit" disabled={busy}>
        {busy ? phaseLabel(phase) : wallet.address ? "Approve this simulated saving" : "Connect wallet and approve saving"}
      </button>
    </form>
  );
}

function Receipt({
  network,
  phone,
  airtime,
  preview,
  rate,
  decimals,
}: {
  network: string;
  phone: string;
  airtime: string;
  preview: AirtimePreview;
  rate: string;
  decimals: number;
}) {
  return (
    <section className="rounded-3xl bg-cream-deep p-4 text-sm" aria-label="Simulated airtime receipt">
      <h2 className="font-display text-xl">Simulated receipt</h2>
      <ul className="mt-3 space-y-1">
        <li>Network: {network}</li>
        <li>Number: {phone}</li>
        <li>Airtime: {airtime}</li>
        {preview.ok ? (
          <>
            <li>Saving set aside: GHS {formatPesewas(preview.savingPesewas)}</li>
            <li>Rule: {preview.ruleLabel}</li>
            <li>Demonstration rate: {rate} GHS per DUSD</li>
            <li>Sandbox DUSD to approve: {formatBaseUnits(preview.dusdBaseUnits, decimals)}</li>
          </>
        ) : (
          <li>{preview.message}</li>
        )}
      </ul>
      <p className="mt-3">No airtime was sent. No real money moved.</p>
    </section>
  );
}

type AirtimePreview =
  | {
      ok: true;
      purchasePesewas: bigint;
      savingPesewas: bigint;
      dusdBaseUnits: bigint;
      ruleLabel: string;
    }
  | { ok: false; message: string };

function previewAirtime(
  purchasePesewas: bigint | null,
  pot: PotMetadata | null,
  rate: string,
  decimals: number,
): AirtimePreview {
  if (!purchasePesewas) {
    return { ok: false, message: "Choose an airtime amount." };
  }
  if (!pot) {
    return { ok: false, message: "Create a pot on this device, then choose it to calculate the saving." };
  }
  try {
    const saved = savingPesewas({
      rule: pot.rule,
      purchasePesewas,
      fixedPesewas: pot.fixedPesewas ? BigInt(pot.fixedPesewas) : undefined,
      intervalPesewas: pot.intervalPesewas ? BigInt(pot.intervalPesewas) : undefined,
    });
    const dusdBaseUnits = pesewasToBaseUnits(saved, parseRateToPesewas(rate), decimals);
    if (dusdBaseUnits <= 0n) {
      return { ok: false, message: "That saving rounds down to zero DUSD. Increase the saving or the airtime amount." };
    }
    const ruleLabel = pot.rule === "fixed" ? `Fixed GHS ${formatPesewas(saved)}` : `Round up, saving GHS ${formatPesewas(saved)}`;
    return { ok: true, purchasePesewas, savingPesewas: saved, dusdBaseUnits, ruleLabel };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof MoneyInputError || error instanceof Error ? error.message : "Check the airtime demo.",
    };
  }
}
