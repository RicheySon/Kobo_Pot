import Link from "next/link";

import { DeploymentNotice } from "@/components/deployment-notice";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-pine-dark">Stellar Testnet sandbox</p>
        <h1 className="font-display mt-3 text-4xl text-ink sm:text-5xl">Save a little after each purchase.</h1>
        <p className="mt-4 max-w-2xl text-lg">
          KoboPot keeps a personal savings pot on Stellar Testnet. You record a simulated Mobile Money purchase,
          choose a fixed amount or a round-up, and approve an exact DUSD contribution into contract custody.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-ink/80">
          Purchases are simulated. The exchange rate of 12.00 GHS per DUSD is a demonstration figure. DUSD has no
          real monetary value.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="primary-button" href="/onboarding">
            Start onboarding
          </Link>
          <Link className="secondary-button" href="/pot/new">
            Create a pot
          </Link>
          <Link className="secondary-button" href="/airtime">
            Buy airtime
          </Link>
        </div>
      </section>
      <DeploymentNotice />
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl bg-white p-5">
          <h2 className="font-display text-2xl">1. Name a goal</h2>
          <p className="mt-2 text-sm">Set a goal in cedis and a saving rule. The name stays in this browser.</p>
        </article>
        <article className="rounded-3xl bg-white p-5">
          <h2 className="font-display text-2xl">2. Simulate a purchase</h2>
          <p className="mt-2 text-sm">Enter airtime, food, or transport. KoboPot calculates the saving in pesewas.</p>
        </article>
        <article className="rounded-3xl bg-white p-5">
          <h2 className="font-display text-2xl">3. Approve DUSD</h2>
          <p className="mt-2 text-sm">Your Testnet wallet signs a transfer into the pot. The dashboard reads the chain.</p>
        </article>
      </section>
    </div>
  );
}
