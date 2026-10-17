import { AirtimeDemo } from "@/components/airtime-demo";

export default function AirtimePage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-pine-dark">Dummy portal</p>
        <h1 className="font-display mt-2 text-4xl">Buy airtime</h1>
        <p className="mt-2 max-w-2xl text-sm">
          This checkout is a dummy. It records an order in this browser and stops there. KoboPot does not sell airtime.
        </p>
      </header>
      <AirtimeDemo />
    </div>
  );
}
