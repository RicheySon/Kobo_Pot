"use client";

import { Networks, StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";

import { devLog } from "../observability";
import { getPublicConfig } from "./config";

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

let initialized = false;

function ensureKit(): void {
  if (initialized) {
    return;
  }
  const config = getPublicConfig();
  StellarWalletsKit.init({
    modules: [new FreighterModule()],
    network: Networks.TESTNET,
  });
  StellarWalletsKit.setNetwork(Networks.TESTNET);
  initialized = true;
  devLog("wallet_kit_ready", { network: config.network });
}

export async function freighterAvailable(): Promise<boolean> {
  ensureKit();
  return new FreighterModule().isAvailable();
}

export async function connectTestnetWallet(): Promise<string> {
  ensureKit();
  const available = await freighterAvailable();
  if (!available) {
    devLog("wallet_connection", { result: "unavailable" });
    throw new WalletFlowError(
      "unavailable",
      "Freighter is not available in this browser. Install it, switch it to Testnet, and try again.",
    );
  }
  try {
    const { address } = await StellarWalletsKit.authModal();
    const network = await StellarWalletsKit.getNetwork();
    const config = getPublicConfig();
    if (network.networkPassphrase !== config.networkPassphrase) {
      devLog("wallet_connection", { result: "wrong_network" });
      throw new WalletFlowError(
        "wrong_network",
        "The wallet is not on Stellar Testnet. Switch Freighter to Testnet and connect again.",
      );
    }
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

export async function signTestnetTransaction(xdr: string, address: string): Promise<string> {
  ensureKit();
  const config = getPublicConfig();
  try {
    const signed = await StellarWalletsKit.signTransaction(xdr, {
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
  await StellarWalletsKit.disconnect();
}
