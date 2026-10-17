export const ghanaNetworks = [
  {
    id: "MTN",
    name: "MTN Ghana",
    formerName: null,
    prefixes: ["024", "025", "053", "054", "055", "059"],
    card: "#FFCC00",
    ink: "#1c1915",
    accent: "#1c1915",
  },
  {
    id: "Telecel",
    name: "Telecel Ghana",
    formerName: "Vodafone",
    prefixes: ["020", "050"],
    card: "#E4002B",
    ink: "#ffffff",
    accent: "#ffffff",
  },
  {
    id: "AT",
    name: "AT Ghana",
    formerName: "AirtelTigo",
    prefixes: ["026", "027", "056", "057"],
    card: "#1c1915",
    ink: "#ffffff",
    accent: "#E4002B",
  },
] as const;

export type AirtimeNetwork = (typeof ghanaNetworks)[number]["id"];

export const airtimeBundles = [
  { id: "ghs-1", label: "GH₵1", ghs: "1.00", pesewas: 100n },
  { id: "ghs-2", label: "GH₵2", ghs: "2.00", pesewas: 200n },
  { id: "ghs-5", label: "GH₵5", ghs: "5.00", pesewas: 500n },
  { id: "ghs-10", label: "GH₵10", ghs: "10.00", pesewas: 1000n },
  { id: "ghs-20", label: "GH₵20", ghs: "20.00", pesewas: 2000n },
  { id: "ghs-50", label: "GH₵50", ghs: "50.00", pesewas: 5000n },
  { id: "ghs-100", label: "GH₵100", ghs: "100.00", pesewas: 10000n },
] as const;

export type AirtimeBundleId = (typeof airtimeBundles)[number]["id"];

export function findAirtimeBundle(id: string) {
  return airtimeBundles.find((bundle) => bundle.id === id) ?? null;
}

export function findGhanaNetwork(id: AirtimeNetwork) {
  const network = ghanaNetworks.find((item) => item.id === id);
  if (!network) {
    throw new Error("Unknown Ghana airtime network.");
  }
  return network;
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

/**
 * The network that usually issues this prefix.
 * Number porting means the prefix is only a hint.
 */
export function usualNetworkForPhone(value: string): AirtimeNetwork | null {
  const digits = value.replace(/[\s-]/g, "");
  const local = digits.startsWith("233") ? `0${digits.slice(3)}` : digits;
  if (local.length < 3) {
    return null;
  }
  const prefix = local.slice(0, 3);
  return ghanaNetworks.find((network) => network.prefixes.some((item) => item === prefix))?.id ?? null;
}

export function maskPhone(phone: string): string {
  return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
}

export function airtimeDescription(network: AirtimeNetwork, ghs: string, phone: string): string {
  return `${findGhanaNetwork(network).name} airtime GH₵${ghs} for ${maskPhone(phone)}`;
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
