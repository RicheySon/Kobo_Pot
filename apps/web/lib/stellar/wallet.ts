"use client";

import { devLog } from "../observability";
import { getPublicConfig } from "./config";

const GHOSTSIG_ID = "ghostsig";

export type WalletFailure =
  | "unavailable"
  | "rejected"
  | "wrong_network"
  | "signing_failed";

export class WalletFlowError extends Error {
  readonly failure: WalletFailure;

  constructor(failure: WalletFailure, message: string) {
    super(message);
    this.name = "WalletFlowError";
    this.failure = failure;
  }
}

type WalletKit = typeof import("@creit.tech/stellar-wallets-kit");

let initialized = false;
let kitPromise: Promise<WalletKit> | null = null;

function loadKit(): Promise<WalletKit> {
  kitPromise ??= import("@creit.tech/stellar-wallets-kit");
  return kitPromise;
}

export async function testnetWalletModules(walletConnect?: {
  projectId: string;
  origin: string;
}) {
  const [{ Networks }, { defaultModules }, { GhostsigModule }, walletConnectModule] = await Promise.all([
    import("@creit.tech/stellar-wallets-kit"),
    import("@creit.tech/stellar-wallets-kit/modules/utils"),
    import("@creit.tech/stellar-wallets-kit/modules/ghostsig"),
    import("@creit.tech/stellar-wallets-kit/modules/wallet-connect"),
  ]);
  const modules = defaultModules({
    filterBy: (module) => module.productId !== GHOSTSIG_ID,
  });
  modules.push(new GhostsigModule({ network: Networks.TESTNET }));

  const projectId = walletConnect?.projectId.trim() ?? "";
  if (projectId && walletConnect) {
    modules.push(
      new walletConnectModule.WalletConnectModule({
        projectId,
        allowedChains: [walletConnectModule.WalletConnectTargetChain.TESTNET],
        metadata: {
          name: "KoboPot",
          description: "Stellar Testnet savings pots. DUSD has no real monetary value.",
          url: walletConnect.origin,
          icons: [`${walletConnect.origin}/favicon.ico`],
        },
      }),
    );
  }

  return modules;
}

async function ensureKit(): Promise<WalletKit> {
  const kit = await loadKit();
  if (initialized) {
    return kit;
  }
  if (typeof window === "undefined") {
    throw new WalletFlowError("unavailable", "Open KoboPot in a browser to connect a wallet.");
  }
  const config = getPublicConfig();
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
  kit.StellarWalletsKit.init({
    modules: await testnetWalletModules({
      projectId,
      origin: window.location.origin,
    }),
    network: kit.Networks.TESTNET,
    authModal: {
      hideUnsupportedWallets: false,
      showInstallLabel: true,
    },
  });
  kit.StellarWalletsKit.setNetwork(kit.Networks.TESTNET);
  initialized = true;
  devLog("wallet_kit_ready", { network: config.network });
  return kit;
}

export async function connectTestnetWallet(): Promise<string> {
  const kit = await ensureKit();
  try {
    const { address } = await kit.StellarWalletsKit.authModal();
    await assertSelectedWalletIsTestnet(kit);
    devLog("wallet_connection", { result: "connected" });
    return address;
  } catch (error) {
    if (error instanceof WalletFlowError) {
      throw error;
    }
    devLog("wallet_connection", { result: "rejected" });
    throw new WalletFlowError(
      "rejected",
      "The wallet request was closed before a Testnet account was connected.",
    );
  }
}

async function assertSelectedWalletIsTestnet(kit: WalletKit): Promise<void> {
  const config = getPublicConfig();
  try {
    const network = await kit.StellarWalletsKit.getNetwork();
    if (network.networkPassphrase && network.networkPassphrase !== config.networkPassphrase) {
      devLog("wallet_connection", { result: "wrong_network" });
      throw new WalletFlowError(
        "wrong_network",
        "The wallet is not on Stellar Testnet. Switch it to Testnet and connect again.",
      );
    }
  } catch (error) {
    if (error instanceof WalletFlowError) {
      throw error;
    }
    devLog("wallet_connection", { result: "network_unreported" });
  }
}

export async function signTestnetTransaction(xdr: string, address: string): Promise<string> {
  const kit = await ensureKit();
  const config = getPublicConfig();
  try {
    const signed = await kit.StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: config.networkPassphrase,
      address,
    });
    devLog("wallet_signature", { result: "signed" });
    return signed.signedTxXdr;
  } catch {
    devLog("wallet_signature", { result: "rejected" });
    throw new WalletFlowError("rejected", "The wallet did not sign this transaction.");
  }
}

export async function disconnectWallet(): Promise<void> {
  if (!initialized) {
    return;
  }
  const kit = await loadKit();
  await kit.StellarWalletsKit.disconnect();
}
