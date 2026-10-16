const REFERENCE_PATTERN = /^KBP-\d{8}-[0-9a-f-]{36}$/i;

export function createSandboxReference(
  date = new Date(),
  randomUuid = crypto.randomUUID(),
): string {
  const year = date.getUTCFullYear().toString();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `KBP-${year}${month}${day}-${randomUuid}`;
}

export function isSandboxReference(value: string): boolean {
  return REFERENCE_PATTERN.test(value.trim());
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(normalized)) {
    throw new Error("A contribution reference hash must be 32 bytes.");
  }
  const bytes = new Uint8Array(32);
  for (let index = 0; index < 32; index += 1) {
    bytes[index] = Number.parseInt(normalized.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}
