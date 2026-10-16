import { Suspense } from "react";

import { WithdrawPageClient } from "@/components/withdraw-page-client";

export default function WithdrawPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl">Withdraw</h1>
        <p className="mt-2 max-w-2xl text-sm">
          Only the pot owner can withdraw, and only after the unlock time. DUSD returns to that owner on Testnet and
          still has no real monetary value.
        </p>
      </header>
      <Suspense fallback={<p>Loading the withdrawal form.</p>}>
        <WithdrawPageClient />
      </Suspense>
    </div>
  );
}
