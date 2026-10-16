import { getPublicConfig } from "@/lib/stellar/config";
import { contractExplorerUrl } from "@/lib/stellar/explorer";

export function DeploymentNotice() {
  const config = getPublicConfig();
  if (!config.contractId || !config.tokenContractId) {
    return (
      <p className="rounded-2xl bg-white p-4 text-sm" role="status">
        No KoboPot contract ID or DUSD token ID is configured yet. You can review savings rules in this browser.
        Creating a pot, contributing, and withdrawing need a Testnet deployment.
      </p>
    );
  }
  return (
    <p className="rounded-2xl bg-white p-4 text-sm">
      This sandbox is pointed at a Testnet contract.{" "}
      <a className="text-pine-dark underline" href={contractExplorerUrl(config.explorerBaseUrl, config.contractId)}>
        View the contract on the Testnet explorer
      </a>
      .
    </p>
  );
}
