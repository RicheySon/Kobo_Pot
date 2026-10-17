"use client";

import Link from "next/link";

import { usePotMetadataList } from "@/hooks/local-records";
import { useWallet } from "@/hooks/wallet-provider";

export function SiteHeader() {
  const wallet = useWallet();
  const latest = usePotMetadataList()[0];
  const detailHref = latest ? `/pot/${latest.id}` : "/dashboard";

  return (
    <header className="border-b border-cream-deep bg-cream">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="font-display text-2xl text-ink">
          KoboPot
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Primary">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/airtime">Airtime</NavLink>
          <NavLink href="/purchase">Add savings</NavLink>
          <NavLink href={detailHref}>Pot details</NavLink>
          <span className="rounded-full bg-pine/10 px-3 py-1 font-medium text-pine-dark">
            Testnet
          </span>
        </nav>
        <div className="flex items-center gap-2">
          {wallet.address ? (
            <>
              <span className="max-w-40 truncate text-sm text-ink" title={wallet.address}>
                {shortAddress(wallet.address)}
              </span>
              <button type="button" className="secondary-button" onClick={() => void wallet.disconnect()}>
                Disconnect
              </button>
            </>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={() => void wallet.connect()}
              disabled={wallet.busy}
            >
              {wallet.busy ? "Connecting" : "Connect wallet"}
            </button>
          )}
        </div>
      </div>
      {wallet.message ? (
        <p className="mx-auto max-w-5xl px-4 pb-3 text-sm text-clay" role="status">
          {wallet.message}
        </p>
      ) : null}
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1 text-ink underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
    >
      {children}
    </Link>
  );
}

function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}
