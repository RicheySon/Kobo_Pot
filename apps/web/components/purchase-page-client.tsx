"use client";

import { useSearchParams } from "next/navigation";

import { PurchaseForm } from "@/components/purchase-form";

export function PurchasePageClient() {
  const params = useSearchParams();
  const pot = params.get("pot") ?? undefined;
  return <PurchaseForm initialPotId={pot} />;
}
