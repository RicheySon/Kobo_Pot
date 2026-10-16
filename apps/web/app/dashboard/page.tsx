import { DashboardView } from "@/components/dashboard-view";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm">
          Names come from this browser. Balances, progress, and contribution counts come from the savings pot contract
          after you connect a Testnet wallet.
        </p>
      </header>
      <DashboardView />
    </div>
  );
}
