import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import type { ReactNode } from "react";

import { SandboxBanner } from "@/components/sandbox-banner";
import { SiteHeader } from "@/components/site-header";
import { WalletProvider } from "@/hooks/wallet-provider";

import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
});

export const metadata: Metadata = {
  title: "KoboPot",
  description:
    "A Stellar Testnet sandbox for personal savings pots. Simulated purchases, a demonstration exchange rate, and DUSD have no real monetary value.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-cream text-ink antialiased">
        <WalletProvider>
          <SandboxBanner />
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
