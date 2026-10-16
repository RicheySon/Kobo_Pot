"use client";

import { useSearchParams } from "next/navigation";

import { WithdrawForm } from "@/components/withdraw-form";

export function WithdrawPageClient() {
  const params = useSearchParams();
  const pot = params.get("pot") ?? undefined;
  return <WithdrawForm initialPotId={pot} />;
}
