import { Suspense } from "react";

import { AirtimeDemo } from "@/components/airtime-demo";

export default function AirtimePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl">Simulate airtime</h1>
        <p className="mt-2 max-w-2xl text-sm">
          KoboPot does not sell airtime and does not debit Mobile Money. This demo pretends a Ghana airtime purchase
          happened, calculates the saving for your pot, and asks your Testnet wallet to approve sandbox DUSD.
        </p>
      </header>
      <Suspense fallback={<p>Loading the airtime demo.</p>}>
        <AirtimeDemo />
      </Suspense>
    </div>
  );
}
