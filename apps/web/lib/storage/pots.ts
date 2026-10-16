export type SavingRuleName = "fixed" | "round_up";

export type PotMetadata = {
  id: string;
  goalName: string;
  category: string;
  note: string;
  rule: SavingRuleName;
  fixedPesewas: string | null;
  intervalPesewas: string | null;
  goalPesewas: string;
  createdAt: string;
};

export type PurchaseRecord = {
  potId: string;
  category: string;
  description: string;
  purchasePesewas: string;
  savingPesewas: string;
  rate: string;
  dusdBaseUnits: string;
  reference: string;
  purchasedAt: string;
  transactionHash: string | null;
};

const POTS_KEY = "kobopot.pot-index.v1";
const PURCHASES_KEY = "kobopot.purchase-index.v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function listPotMetadata(): PotMetadata[] {
  return readList<PotMetadata>(POTS_KEY);
}

export function savePotMetadata(entry: PotMetadata): void {
  const current = listPotMetadata().filter((item) => item.id !== entry.id);
  current.unshift(entry);
  writeList(POTS_KEY, current);
}

export function findPotMetadata(id: string): PotMetadata | null {
  return listPotMetadata().find((item) => item.id === id) ?? null;
}

export function listPurchases(potId?: string): PurchaseRecord[] {
  const records = readList<PurchaseRecord>(PURCHASES_KEY);
  if (!potId) {
    return records;
  }
  return records.filter((record) => record.potId === potId);
}

export function savePurchase(record: PurchaseRecord): void {
  const current = listPurchases().filter((item) => item.reference !== record.reference);
  current.unshift(record);
  writeList(PURCHASES_KEY, current);
}

function readList<T>(key: string): T[] {
  if (!canUseStorage()) {
    return [];
  }
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeList(key: string, value: unknown): void {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("kobopot-local-change"));
}
