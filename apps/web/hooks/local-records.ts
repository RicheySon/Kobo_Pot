"use client";

import { useSyncExternalStore } from "react";

import {
  listPotMetadata,
  listPurchases,
  type PotMetadata,
  type PurchaseRecord,
} from "@/lib/storage/pots";

const EMPTY_POTS: PotMetadata[] = [];
const EMPTY_PURCHASES: PurchaseRecord[] = [];

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("kobopot-local-change", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("kobopot-local-change", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

let potRaw = "";
let potSnapshot: PotMetadata[] = EMPTY_POTS;

function readPots(): PotMetadata[] {
  const raw = window.localStorage.getItem("kobopot.pot-index.v1") ?? "";
  if (raw === potRaw) {
    return potSnapshot;
  }
  potRaw = raw;
  potSnapshot = raw ? listPotMetadata() : EMPTY_POTS;
  return potSnapshot;
}

export function usePotMetadataList(): PotMetadata[] {
  return useSyncExternalStore(subscribe, readPots, () => EMPTY_POTS);
}

const purchaseSnapshots = new Map<string, { raw: string; value: PurchaseRecord[] }>();

function readPurchases(potId: string | undefined): PurchaseRecord[] {
  const raw = window.localStorage.getItem("kobopot.purchase-index.v1") ?? "";
  const cacheKey = potId ?? "*";
  const cached = purchaseSnapshots.get(cacheKey);
  if (cached && cached.raw === raw) {
    return cached.value;
  }
  const value = raw ? listPurchases(potId) : EMPTY_PURCHASES;
  purchaseSnapshots.set(cacheKey, { raw, value });
  return value;
}

export function usePurchases(potId?: string): PurchaseRecord[] {
  return useSyncExternalStore(
    subscribe,
    () => readPurchases(potId),
    () => EMPTY_PURCHASES,
  );
}
