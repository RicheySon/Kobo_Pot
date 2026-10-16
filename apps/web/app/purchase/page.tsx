import { Suspense } from "react";

import { PurchasePageClient } from "@/components/purchase-page-client";

export default function PurchasePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl">Simulated purchase</h1>
        <p className="mt-2 max-w-2xl text-sm">
          This form imitates a Mobile Money purchase. Approving it transfers sandbox DUSD on Stellar Testnet. The rate
          of 12.00 GHS per DUSD is a demonstration figure, and DUSD has no real monetary value.
        </p>
      </header>
      <Suspense fallback={<p>Loading the purchase form.</p>}>
        <PurchasePageClient />
      </Suspense>
    </div>
  );
}
