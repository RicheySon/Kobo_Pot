import { z } from "zod";

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

const publicConfigSchema = z.object({
  appName: z.literal("KoboPot"),
  network: z.literal("testnet"),
  networkPassphrase: z.literal(TESTNET_PASSPHRASE),
  rpcUrl: z.string().url(),
  horizonUrl: z.string().url(),
  contractId: z.string(),
  tokenContractId: z.string(),
  tokenSymbol: z.literal("DUSD"),
  tokenDecimals: z.number().int().min(0).max(18),
  explorerBaseUrl: z.string().url(),
  demoGhsPerDusd: z.string().regex(/^\d+\.\d{2}$/),
  demoMode: z.literal(true),
});

export type PublicConfig = z.infer<typeof publicConfigSchema>;

function read(env: Record<string, string | undefined>, name: string, fallback: string): string {
  const value = env[name];
  if (value === undefined || value.trim() === "") {
    return fallback;
  }
  return value.trim();
}

export function loadPublicConfig(
  env: Record<string, string | undefined> = process.env,
): PublicConfig {
  return publicConfigSchema.parse({
    appName: read(env, "NEXT_PUBLIC_APP_NAME", "KoboPot"),
    network: read(env, "NEXT_PUBLIC_STELLAR_NETWORK", "testnet"),
    networkPassphrase: read(env, "NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE", TESTNET_PASSPHRASE),
    rpcUrl: read(env, "NEXT_PUBLIC_STELLAR_RPC_URL", "https://soroban-testnet.stellar.org"),
    horizonUrl: read(env, "NEXT_PUBLIC_HORIZON_URL", "https://horizon-testnet.stellar.org"),
    contractId: read(env, "NEXT_PUBLIC_CONTRACT_ID", ""),
    tokenContractId: read(env, "NEXT_PUBLIC_TOKEN_CONTRACT_ID", ""),
    tokenSymbol: read(env, "NEXT_PUBLIC_TOKEN_SYMBOL", "DUSD"),
    tokenDecimals: Number(read(env, "NEXT_PUBLIC_TOKEN_DECIMALS", "7")),
    explorerBaseUrl: read(
      env,
      "NEXT_PUBLIC_EXPLORER_BASE_URL",
      "https://stellar.expert/explorer/testnet",
    ),
    demoGhsPerDusd: read(env, "NEXT_PUBLIC_DEMO_GHS_PER_DUSD", "12.00"),
    demoMode: read(env, "NEXT_PUBLIC_DEMO_MODE", "true") === "true",
  });
}

export function assertConfigured(config: PublicConfig): void {
  if (!config.explorerBaseUrl.includes("/testnet")) {
    throw new Error("Explorer links must target the Stellar Testnet explorer.");
  }
  if (config.contractId !== "" && !/^C[A-Z0-9]{55}$/.test(config.contractId)) {
    throw new Error("The KoboPot contract ID is not a Testnet contract address.");
  }
  if (config.tokenContractId !== "" && !/^C[A-Z0-9]{55}$/.test(config.tokenContractId)) {
    throw new Error("The DUSD token contract ID is not a Testnet contract address.");
  }
}

export function getPublicConfig(): PublicConfig {
  const config = loadPublicConfig();
  assertConfigured(config);
  return config;
}

export const SANDBOX_NOTICE =
  "Stellar Testnet demo. Purchases and exchange rates are simulated. DUSD has no real monetary value.";
