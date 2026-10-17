import { type DummyAirtimeOrder } from "../savings/airtime";

const ORDERS_KEY = "kobopot.airtime-dummy.v1";
const CHANGE_EVENT = "kobopot-airtime-dummy";
const EMPTY_ORDERS: DummyAirtimeOrder[] = [];

let cachedRaw = "";
let cachedOrders: DummyAirtimeOrder[] = EMPTY_ORDERS;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function listDummyAirtimeOrders(): DummyAirtimeOrder[] {
  if (!canUseStorage()) {
    return EMPTY_ORDERS;
  }
  const raw = window.localStorage.getItem(ORDERS_KEY) ?? "";
  if (raw === cachedRaw) {
    return cachedOrders;
  }
  cachedRaw = raw;
  if (!raw) {
    cachedOrders = EMPTY_ORDERS;
    return cachedOrders;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    cachedOrders = Array.isArray(parsed) ? (parsed as DummyAirtimeOrder[]) : EMPTY_ORDERS;
  } catch {
    cachedOrders = EMPTY_ORDERS;
  }
  return cachedOrders;
}

export function saveDummyAirtimeOrder(order: DummyAirtimeOrder): DummyAirtimeOrder[] {
  const next = [order, ...listDummyAirtimeOrders().filter((item) => item.id !== order.id)];
  if (canUseStorage()) {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
  return next;
}

export function subscribeDummyAirtimeOrders(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
