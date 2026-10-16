export type PotStatusName = "Active" | "GoalReached" | "Closed";

export type SavingsPotView = {
  id: string;
  owner: string;
  token: string;
  goalAmount: bigint;
  balance: bigint;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  contributionCount: bigint;
  createdAt: bigint;
  unlockAt: bigint;
  status: PotStatusName;
};

const STATUSES = new Set<PotStatusName>(["Active", "GoalReached", "Closed"]);

export function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function parsePotStatus(value: unknown): PotStatusName {
  if (typeof value === "string" && STATUSES.has(value as PotStatusName)) {
    return value as PotStatusName;
  }
  if (Array.isArray(value) && typeof value[0] === "string" && STATUSES.has(value[0] as PotStatusName)) {
    return value[0] as PotStatusName;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.tag === "string" && STATUSES.has(record.tag as PotStatusName)) {
      return record.tag as PotStatusName;
    }
    const keys = Object.keys(record);
    if (keys.length === 1 && STATUSES.has(keys[0] as PotStatusName)) {
      return keys[0] as PotStatusName;
    }
  }
  throw new Error("The pot status from the network was not recognized.");
}

export function parseSavingsPot(value: unknown): SavingsPotView {
  if (!value || typeof value !== "object") {
    throw new Error("The pot record from the network was not recognized.");
  }
  const record = value as Record<string, unknown>;
  return {
    id: readHex(record.id),
    owner: readText(record.owner),
    token: readText(record.token),
    goalAmount: readBigint(record.goal_amount),
    balance: readBigint(record.balance),
    totalDeposited: readBigint(record.total_deposited),
    totalWithdrawn: readBigint(record.total_withdrawn),
    contributionCount: readBigint(record.contribution_count),
    createdAt: readBigint(record.created_at),
    unlockAt: readBigint(record.unlock_at),
    status: parsePotStatus(record.status),
  };
}

export function parsePotId(value: unknown): string {
  return readHex(value);
}

function readHex(value: unknown): string {
  if (value instanceof Uint8Array) {
    return bytesToHex(value);
  }
  if (typeof value === "string" && /^[0-9a-f]{64}$/i.test(value)) {
    return value.toLowerCase();
  }
  throw new Error("A pot id from the network was not recognized.");
}

function readText(value: unknown): string {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  throw new Error("An address from the network was not recognized.");
}

function readBigint(value: unknown): bigint {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return BigInt(value);
  }
  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return BigInt(value);
  }
  throw new Error("An amount from the network was not recognized.");
}
