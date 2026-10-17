"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { WalletFlowError, connectTestnetWallet, disconnectWallet } from "@/lib/stellar/wallet";

type WalletContextValue = {
  address: string | null;
  busy: boolean;
  message: string | null;
  connect: () => Promise<string | null>;
  disconnect: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      busy,
      message,
      connect: async () => {
        setBusy(true);
        setMessage(null);
        try {
          const next = await connectTestnetWallet();
          setAddress(next);
          return next;
        } catch (error) {
          const text =
            error instanceof WalletFlowError
              ? error.message
              : "The wallet could not be connected.";
          setMessage(text);
          return null;
        } finally {
          setBusy(false);
        }
      },
      disconnect: async () => {
        await disconnectWallet();
        setAddress(null);
        setMessage(null);
      },
    }),
    [address, busy, message],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const value = useContext(WalletContext);
  if (!value) {
    throw new Error("Wallet tools are only available inside the KoboPot app shell.");
  }
  return value;
}
