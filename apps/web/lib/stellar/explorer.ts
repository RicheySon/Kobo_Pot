export function contractExplorerUrl(baseUrl: string, contractId: string): string {
  assertTestnetExplorer(baseUrl);
  return `${trimSlash(baseUrl)}/contract/${contractId}`;
}

export function transactionExplorerUrl(baseUrl: string, hash: string): string {
  assertTestnetExplorer(baseUrl);
  return `${trimSlash(baseUrl)}/tx/${hash}`;
}

export function accountExplorerUrl(baseUrl: string, address: string): string {
  assertTestnetExplorer(baseUrl);
  return `${trimSlash(baseUrl)}/account/${address}`;
}

function assertTestnetExplorer(baseUrl: string): void {
  if (!baseUrl.includes("/testnet")) {
    throw new Error("Explorer links must target the Stellar Testnet explorer.");
  }
}

function trimSlash(value: string): string {
  return value.replace(/\/$/, "");
}
