import { Address, Contract, nativeToScVal, scValToNative, xdr } from "@stellar/stellar-sdk";

import { hexToBytes } from "../savings/reference";
import { getPublicConfig } from "../stellar/config";
import { parsePotId, parseSavingsPot, type SavingsPotView } from "./parse";

export type ContractMethod =
  | "create_pot"
  | "get_pot"
  | "contribute"
  | "withdraw"
  | "close_pot";

export function requireContractIds(): { contractId: string; tokenContractId: string } {
  const config = getPublicConfig();
  if (!config.contractId || !config.tokenContractId) {
    throw new Error(
      "This sandbox is not pointed at a deployed KoboPot contract and DUSD token yet.",
    );
  }
  return { contractId: config.contractId, tokenContractId: config.tokenContractId };
}

export function buildCreatePot(owner: string, goalBaseUnits: bigint, unlockAt: bigint): xdr.Operation {
  const { contractId, tokenContractId } = requireContractIds();
  return new Contract(contractId).call(
    "create_pot",
    new Address(owner).toScVal(),
    new Address(tokenContractId).toScVal(),
    nativeToScVal(goalBaseUnits, { type: "i128" }),
    nativeToScVal(unlockAt, { type: "u64" }),
  );
}

export function buildGetPot(potIdHex: string): xdr.Operation {
  const { contractId } = requireContractIds();
  return new Contract(contractId).call("get_pot", bytesArg(potIdHex));
}

export function buildContribute(
  potIdHex: string,
  contributor: string,
  amount: bigint,
  referenceHashHex: string,
): xdr.Operation {
  const { contractId } = requireContractIds();
  return new Contract(contractId).call(
    "contribute",
    bytesArg(potIdHex),
    new Address(contributor).toScVal(),
    nativeToScVal(amount, { type: "i128" }),
    bytesArg(referenceHashHex),
  );
}

export function buildWithdraw(potIdHex: string, owner: string, amount: bigint): xdr.Operation {
  const { contractId } = requireContractIds();
  return new Contract(contractId).call(
    "withdraw",
    bytesArg(potIdHex),
    new Address(owner).toScVal(),
    nativeToScVal(amount, { type: "i128" }),
  );
}

export function buildClosePot(potIdHex: string, owner: string): xdr.Operation {
  const { contractId } = requireContractIds();
  return new Contract(contractId).call(
    "close_pot",
    bytesArg(potIdHex),
    new Address(owner).toScVal(),
  );
}

export function readPotResult(value: xdr.ScVal | undefined): SavingsPotView {
  if (!value) {
    throw new Error("The network did not return a savings pot.");
  }
  return parseSavingsPot(scValToNative(value));
}

export function readPotIdResult(value: xdr.ScVal | undefined): string {
  if (!value) {
    throw new Error("The network did not return a pot id.");
  }
  return parsePotId(scValToNative(value));
}

function bytesArg(hex: string): xdr.ScVal {
  return nativeToScVal(hexToBytes(hex), { type: "bytes" });
}
