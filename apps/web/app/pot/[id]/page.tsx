import { Suspense } from "react";

import { PotDetail } from "@/components/pot-detail";

export default function PotPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p>Loading this savings pot.</p>}>
      <ResolvedPot params={params} />
    </Suspense>
  );
}

async function ResolvedPot({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PotDetail potId={id} />;
}
