"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";

import { Field } from "@/components/field";
import {
  airtimeBundles,
  airtimeNetworks,
  createDummyAirtimeOrder,
  findAirtimeBundle,
  maskPhone,
  parseGhanaPhone,
  type AirtimeBundleId,
  type AirtimeNetwork,
  type DummyAirtimeOrder,
} from "@/lib/savings/airtime";
import { listDummyAirtimeOrders, saveDummyAirtimeOrder, subscribeDummyAirtimeOrders } from "@/lib/storage/airtime";

export function AirtimeDemo() {
  const orders = useSyncExternalStore(subscribeDummyAirtimeOrders, listDummyAirtimeOrders, emptyOrders);
  const [network, setNetwork] = useState<AirtimeNetwork>("MTN");
  const [bundleId, setBundleId] = useState<AirtimeBundleId>("ghs-10");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [latest, setLatest] = useState<DummyAirtimeOrder | null>(null);
  const bundle = findAirtimeBundle(bundleId);
  const parsedPhone = parseGhanaPhone(phone);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLatest(null);
    if (!parsedPhone || !bundle) {
      setError("Enter a Ghana mobile number, like 0244123456.");
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
    }, 700);
  }

  return (
    <div className="space-y-5">
      <p className="rounded-2xl bg-white p-4 text-sm">
        Dummy portal. Buy airtime here only pretends to check out. No airtime is sent, Mobile Money is not debited, and
        the savings pot does not change.
      </p>
      <form className="space-y-5 rounded-3xl bg-white p-5" onSubmit={onSubmit} noValidate>
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
        <Field
          label="Mobile number"
          hint="Shown on the dummy receipt in this browser only."
          error={error ?? undefined}
        >
          <input
            className="text-input"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0244123456"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </Field>
        <p className="text-sm">Payment: dummy balance. Nothing is charged.</p>
        <button className="primary-button" type="submit" disabled={processing}>
          {processing ? "Processing dummy payment" : `Buy ${bundle?.label ?? "airtime"}`}
        </button>
      </form>
      {latest ? <DummyReceipt order={latest} /> : null}
      {orders.length > 0 ? (
        <section className="rounded-3xl bg-white p-5" aria-label="Dummy airtime orders">
          <h2 className="font-display text-2xl">Dummy orders on this device</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {orders.map((order) => (
              <li key={order.id}>
                {order.id}: {order.network} GHS {order.ghs} for {maskPhone(order.phone)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function DummyReceipt({ order }: { order: DummyAirtimeOrder }) {
  return (
    <section className="rounded-3xl bg-cream-deep p-5" aria-live="polite" aria-label="Dummy airtime receipt">
      <p className="text-sm font-semibold uppercase tracking-wide text-pine-dark">Dummy success</p>
      <h2 className="font-display mt-2 text-3xl">Purchase complete</h2>
      <ul className="mt-3 space-y-1 text-sm">
        <li>Order: {order.id}</li>
        <li>Network: {order.network}</li>
        <li>Number: {maskPhone(order.phone)}</li>
        <li>Airtime: GHS {order.ghs}</li>
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
