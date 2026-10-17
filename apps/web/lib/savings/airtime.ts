export const airtimeNetworks = ["MTN", "Telecel", "AT"] as const;

export type AirtimeNetwork = (typeof airtimeNetworks)[number];

export const airtimeBundles = [
  { id: "ghs-2", label: "GHS 2", ghs: "2.00", pesewas: 200n },
  { id: "ghs-5", label: "GHS 5", ghs: "5.00", pesewas: 500n },
  { id: "ghs-10", label: "GHS 10", ghs: "10.00", pesewas: 1000n },
  { id: "ghs-20", label: "GHS 20", ghs: "20.00", pesewas: 2000n },
] as const;

export type AirtimeBundleId = (typeof airtimeBundles)[number]["id"];

export function findAirtimeBundle(id: string) {
  return airtimeBundles.find((bundle) => bundle.id === id) ?? null;
}

/** Accept a Ghana mobile number and return the local 10-digit form. */
export function parseGhanaPhone(value: string): string | null {
  const digits = value.replace(/[\s-]/g, "");
  if (/^0\d{9}$/.test(digits)) {
    return digits;
  }
  if (/^233\d{9}$/.test(digits)) {
    return `0${digits.slice(3)}`;
  }
  return null;
}

export function maskPhone(phone: string): string {
  return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
}

export function airtimeDescription(network: AirtimeNetwork, ghs: string, phone: string): string {
  return `${network} airtime GHS ${ghs} for ${maskPhone(phone)}`;
}

export type DummyAirtimeOrder = {
  id: string;
  network: AirtimeNetwork;
  phone: string;
  ghs: string;
  createdAt: string;
};

export function createDummyAirtimeOrder(input: {
  network: AirtimeNetwork;
  bundleId: string;
  phone: string;
  now?: Date;
  id?: string;
}): DummyAirtimeOrder {
  const bundle = findAirtimeBundle(input.bundleId);
  const phone = parseGhanaPhone(input.phone);
  if (!bundle || !phone) {
    throw new Error("Choose a demo bundle and a Ghana mobile number.");
  }
  const now = input.now ?? new Date();
  const year = now.getUTCFullYear().toString();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const suffix = input.id ?? crypto.randomUUID().slice(0, 8);
  return {
    id: `DUMMY-${year}${month}${day}-${suffix}`,
    network: input.network,
    phone,
    ghs: bundle.ghs,
    createdAt: now.toISOString(),
  };
}
