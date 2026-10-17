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
