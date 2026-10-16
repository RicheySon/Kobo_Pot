"use client";

import {
  BASE_FEE,
  Transaction,
  TransactionBuilder,
  rpc,
  xdr,
} from "@stellar/stellar-sdk";

import { contractErrorCodeFromMessage, contractErrorMessage } from "../contract/errors";
import { devLog } from "../observability";
import { WalletFlowError, signTestnetTransaction } from "./wallet";
import { getPublicConfig } from "./config";

export type TxPhase =
  | "idle"
  | "preparing"
  | "awaiting_signature"
  | "submitting"
  | "confirming"
  | "success"
  | "contract_rejection"
  | "network_failure"
  | "timeout"
  | "wallet_unavailable"
  | "wallet_rejected"
  | "wrong_network";

export type TxResult = {
  hash: string;
  returnValue?: xdr.ScVal;
};

const PHASE_TEXT: Record<TxPhase, string> = {
  idle: "Waiting for your confirmation.",
  preparing: "Preparing the Testnet transaction.",
  awaiting_signature: "Waiting for wallet approval.",
  submitting: "Submitting the signed transaction.",
  confirming: "Waiting for Testnet confirmation.",
  success: "Transaction confirmed.",
  contract_rejection: "The savings pot rejected the transaction.",
  network_failure: "The Testnet network could not complete the request.",
  timeout: "The transaction was not confirmed before the wait ended.",
  wallet_unavailable: "A Testnet wallet is not available.",
  wallet_rejected: "The wallet request was not approved.",
  wrong_network: "The wallet is not on Stellar Testnet.",
};

export function phaseLabel(phase: TxPhase): string {
  return PHASE_TEXT[phase];
}

export class TransactionFlowError extends Error {
  readonly phase: TxPhase;
  readonly technical: string;

  constructor(phase: TxPhase, message: string, technical: string) {
    super(message);
    this.name = "TransactionFlowError";
    this.phase = phase;
    this.technical = technical;
  }
}

export async function simulateRead(publicKey: string, operation: xdr.Operation): Promise<xdr.ScVal> {
  const config = getPublicConfig();
  const server = new rpc.Server(config.rpcUrl, { allowHttp: false });
  const account = await server.getAccount(publicKey);
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(60)
    .build();
  const simulation = await server.simulateTransaction(transaction);
  if (rpc.Api.isSimulationError(simulation)) {
    throw simulationFailure(simulation.error);
  }
  if (!simulation.result?.retval) {
    throw new TransactionFlowError(
      "network_failure",
      "Testnet did not return a savings pot.",
      "empty simulation result",
    );
  }
  return simulation.result.retval;
}

export async function submitOperation(input: {
  publicKey: string;
  operation: xdr.Operation;
  onPhase: (phase: TxPhase) => void;
}): Promise<TxResult> {
  const config = getPublicConfig();
  const server = new rpc.Server(config.rpcUrl, { allowHttp: false });
  const started = Date.now();
  input.onPhase("preparing");
  devLog("transaction_phase", { phase: "preparing" });

  let prepared: Transaction;
  try {
    const account = await server.getAccount(input.publicKey);
    const unsigned = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(input.operation)
      .setTimeout(180)
      .build();
    const simulation = await server.simulateTransaction(unsigned);
    if (rpc.Api.isSimulationError(simulation)) {
      throw simulationFailure(simulation.error);
    }
    if (rpc.Api.isSimulationRestore(simulation)) {
      throw new TransactionFlowError(
        "network_failure",
        "This pot's on-chain record needs to be restored before it can be used.",
        "simulation restore preamble",
      );
    }
    prepared = rpc.assembleTransaction(unsigned, simulation).build();
  } catch (error) {
    if (error instanceof TransactionFlowError) {
      input.onPhase(error.phase);
      throw error;
    }
    const message = error instanceof Error ? error.message : "Network request failed";
    const wrapped = classifyTransportError(message);
    input.onPhase(wrapped.phase);
    devLog("rpc_error", { category: wrapped.phase });
    throw wrapped;
  }

  input.onPhase("awaiting_signature");
  devLog("transaction_phase", { phase: "awaiting_signature" });
  let signed: Transaction;
  try {
    const signedXdr = await signTestnetTransaction(prepared.toXDR(), input.publicKey);
    signed = new Transaction(signedXdr, config.networkPassphrase);
  } catch (error) {
    if (error instanceof WalletFlowError) {
      const phase = walletPhase(error.failure);
      input.onPhase(phase);
      throw new TransactionFlowError(phase, error.message, error.failure);
    }
    input.onPhase("wallet_rejected");
    throw new TransactionFlowError(
      "wallet_rejected",
      "The wallet did not sign this transaction.",
      "signing failed",
    );
  }

  input.onPhase("submitting");
  devLog("transaction_phase", { phase: "submitting" });
  let sent: rpc.Api.SendTransactionResponse;
  try {
    sent = await server.sendTransaction(signed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Submission failed";
    input.onPhase("network_failure");
    throw new TransactionFlowError("network_failure", "The transaction could not be submitted.", message);
  }
  if (sent.status === "ERROR") {
    const technical = sent.errorResult?.toXDR("base64") ?? "send error";
    const wrapped = simulationFailure(technical);
    input.onPhase(wrapped.phase);
    throw wrapped;
  }
  if (sent.status === "TRY_AGAIN_LATER") {
    input.onPhase("network_failure");
    throw new TransactionFlowError(
      "network_failure",
      "Testnet asked us to retry this submission. Try again in a moment.",
      "TRY_AGAIN_LATER",
    );
  }

  input.onPhase("confirming");
  devLog("transaction_phase", { phase: "confirming" });
  const result = await server.pollTransaction(sent.hash, { attempts: 20 });
  if (result.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    input.onPhase("timeout");
    throw new TransactionFlowError(
      "timeout",
      "The transaction was submitted, but Testnet did not confirm it in time.",
      sent.hash,
    );
  }
  if (result.status === rpc.Api.GetTransactionStatus.FAILED) {
    const technical = result.resultXdr.toXDR("base64");
    const wrapped = simulationFailure(technical);
    input.onPhase(wrapped.phase);
    throw wrapped;
  }
  devLog("transaction_confirmed", { elapsedMs: Date.now() - started });
  input.onPhase("success");
  return { hash: sent.hash, returnValue: result.returnValue };
}

function walletPhase(failure: WalletFlowError["failure"]): TxPhase {
  if (failure === "unavailable") {
    return "wallet_unavailable";
  }
  if (failure === "wrong_network") {
    return "wrong_network";
  }
  if (failure === "signing_failed") {
    return "wallet_rejected";
  }
  return "wallet_rejected";
}

export function simulationFailure(technical: string): TransactionFlowError {
  const code = contractErrorCodeFromMessage(technical);
  if (code !== null) {
    devLog("contract_error", { code });
    return new TransactionFlowError("contract_rejection", contractErrorMessage(code), technical);
  }
  if (/insufficient/i.test(technical) && /balance/i.test(technical)) {
    return new TransactionFlowError(
      "contract_rejection",
      "The wallet does not have enough DUSD for this sandbox contribution.",
      technical,
    );
  }
  return new TransactionFlowError(
    "network_failure",
    "Testnet could not simulate this transaction.",
    technical,
  );
}

function classifyTransportError(message: string): TransactionFlowError {
  if (/account not found/i.test(message) || /404/.test(message)) {
    return new TransactionFlowError(
      "network_failure",
      "This Testnet account needs a little Testnet XLM before it can create a pot. Use Friendbot, then try again.",
      message,
    );
  }
  return new TransactionFlowError("network_failure", "The Testnet network could not be reached.", message);
}
