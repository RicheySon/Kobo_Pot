import Link from "next/link";

export default function OnboardingPage() {
  return (
    <article className="space-y-6 rounded-3xl bg-white p-6 sm:p-10">
      <h1 className="font-display text-4xl">Onboarding</h1>
      <p>
        This walkthrough uses Stellar Testnet only. Simulated Mobile Money purchases never leave this browser. The
        demonstration rate is 12.00 GHS per DUSD. DUSD has no real monetary value.
      </p>
      <ol className="list-decimal space-y-3 pl-5">
        <li>Choose a Stellar wallet from the connect list and switch it to Testnet. KoboPot never asks for a secret key.</li>
        <li>Connect the wallet. If the account is new, fund it with Friendbot so it can pay Testnet fees, then open a DUSD trustline before approving a contribution.</li>
        <li>Create a pot with a goal in cedis, a fixed saving or a round-up interval, and an optional unlock date.</li>
        <li>Record a simulated purchase. Review the pesewa saving and the rounded-down DUSD amount.</li>
        <li>Approve the contribution. The contract holds the DUSD and the dashboard refreshes from Testnet.</li>
        <li>The owner can withdraw after the unlock time. Anyone else is rejected by the contract.</li>
      </ol>
      <div className="flex flex-wrap gap-3">
        <Link className="primary-button" href="/pot/new">
          Create a pot
        </Link>
        <Link className="secondary-button" href="/dashboard">
          Open dashboard
        </Link>
      </div>
    </article>
  );
}
