import { CreatePotForm } from "@/components/create-pot-form";
import { DeploymentNotice } from "@/components/deployment-notice";

export default function NewPotPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl">Create a savings pot</h1>
        <p className="mt-2 max-w-2xl text-sm">
          The goal name, category, note, and saving rule stay in this browser. Testnet stores the owner, the DUSD
          token, the goal in base units, and the unlock time.
        </p>
      </header>
      <DeploymentNotice />
      <CreatePotForm />
    </div>
  );
}
