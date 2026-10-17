"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";

import { Field } from "@/components/field";
import {
  airtimeBundles,
  createDummyAirtimeOrder,
  findAirtimeBundle,
  findGhanaNetwork,
  ghanaNetworks,
  maskPhone,
  parseGhanaPhone,
  usualNetworkForPhone,
  type AirtimeBundleId,
  type AirtimeNetwork,
  type DummyAirtimeOrder,
} from "@/lib/savings/airtime";
import { listDummyAirtimeOrders, saveDummyAirtimeOrder, subscribeDummyAirtimeOrders } from "@/lib/storage/airtime";

export function AirtimeDemo() {
  const orders = useSyncExternalStore(subscribeDummyAirtimeOrders, listDummyAirtimeOrders, emptyOrders);
  const [network, setNetwork] = useState<AirtimeNetwork>("MTN");
  const [networkLocked, setNetworkLocked] = useState(false);
  const [bundleId, setBundleId] = useState<AirtimeBundleId>("ghs-10");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [latest, setLatest] = useState<DummyAirtimeOrder | null>(null);
  const bundle = findAirtimeBundle(bundleId);
  const parsedPhone = parseGhanaPhone(phone);
  const detected = usualNetworkForPhone(phone);
  const ported = Boolean(detected && detected !== network);

  function onPhoneChange(value: string) {
    setPhone(value);
    if (networkLocked) {
      return;
    }
    const next = usualNetworkForPhone(value);
    if (next) {
      setNetwork(next);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLatest(null);
    if (!parsedPhone || !bundle) {
      setError("Enter a Ghana mobile number, like 024 123 4567.");
      return;
    }
    setError(null);
    setProcessing(true);
    const order = createDummyAirtimeOrder({ network, bundleId, phone: parsedPhone });
    window.setTimeout(() => {
      saveDummyAirtimeOrder(order);
      setLatest(order);
      setProcessing(false);
      setPhone("");
      setNetworkLocked(false);
    }, 700);
  }

  return (
    <div className="space-y-5">
      <p className="rounded-2xl bg-white p-4 text-sm">
        This is a dummy top-up, the way a Ghana airtime page asks for a network, a number, and cedis. No airtime is
        sent, Mobile Money is not debited, and the savings pot does not change.
      </p>
      <form className="space-y-5 rounded-3xl bg-white p-5" onSubmit={onSubmit} noValidate>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Network</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {ghanaNetworks.map((item) => {
              const selected = item.id === network;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="rounded-2xl p-4 text-left"
                  style={{
                    background: item.card,
                    color: item.ink,
                    boxShadow: selected ? "inset 0 0 0 3px #0f5c34" : undefined,
                  }}
                  aria-pressed={selected}
                  onClick={() => {
                    setNetwork(item.id);
                    setNetworkLocked(true);
                  }}
                >
                  <span className="block h-1 w-10 rounded-full" style={{ background: item.accent }} />
                  <span className="font-display mt-3 block text-2xl leading-none">{item.name}</span>
                  <span className="mt-2 block text-sm" style={{ color: item.ink }}>
                    {item.formerName ? `Formerly ${item.formerName}` : "MoMo *170#"}
                  </span>
                  <span className="mt-2 block text-xs tracking-wide" style={{ color: item.ink }}>
                    {item.prefixes.join(" · ")}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Amount</legend>
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
        <Field
          label="Recipient number"
          hint="Type the number and the usual network fills in. You can still pick another network if the line was ported."
          error={error ?? undefined}
        >
          <input
            className="text-input"
            inputMode="tel"
            autoComplete="tel"
            placeholder="024 123 4567"
            value={phone}
            onChange={(event) => onPhoneChange(event.target.value)}
          />
        </Field>
        {ported && detected ? (
          <p className="text-sm">
            {findGhanaNetwork(detected).name} usually uses this prefix. You chose {findGhanaNetwork(network).name}.
            Ported numbers keep the old prefix, so this dummy top-up follows the network you picked.
          </p>
        ) : null}
        <p className="text-sm">Payment: dummy balance. Nothing is charged.</p>
        <button className="primary-button" type="submit" disabled={processing}>
          {processing ? "Processing dummy top-up" : `Top up ${bundle?.label ?? "airtime"}`}
        </button>
      </form>
      {latest ? <DummyReceipt order={latest} /> : null}
      {orders.length > 0 ? (
        <section className="rounded-3xl bg-white p-5" aria-label="Dummy airtime orders">
          <h2 className="font-display text-2xl">Dummy orders on this device</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {orders.map((order) => (
              <li key={order.id}>
                {order.id}: {findGhanaNetwork(order.network).name} GH₵{order.ghs} for {maskPhone(order.phone)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function DummyReceipt({ order }: { order: DummyAirtimeOrder }) {
  const network = findGhanaNetwork(order.network);
  return (
    <section className="rounded-3xl bg-cream-deep p-5" aria-live="polite" aria-label="Dummy airtime receipt">
      <p className="text-sm font-semibold uppercase tracking-wide text-pine-dark">Dummy success</p>
      <h2 className="font-display mt-2 text-3xl">Top-up recorded</h2>
      <ul className="mt-3 space-y-1 text-sm">
        <li>Order: {order.id}</li>
        <li>Network: {network.name}</li>
        <li>Number: {maskPhone(order.phone)}</li>
        <li>Airtime: GH₵{order.ghs}</li>
        <li>Payment: dummy balance</li>
      </ul>
      <p className="mt-3 text-sm">No airtime was sent. No money moved. The savings pot is unchanged.</p>
    </section>
  );
}

const NO_ORDERS: DummyAirtimeOrder[] = [];

function emptyOrders(): DummyAirtimeOrder[] {
  return NO_ORDERS;
}
