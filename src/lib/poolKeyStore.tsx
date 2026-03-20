"use client";

// Simple module-level store for the active pool key.
// In a real app you'd persist this to localStorage or URL params.
// We use a simple React context here so all pages share it.

import { createContext, useContext, useState, ReactNode } from "react";
import { ADDRESSES, DYNAMIC_FEE_FLAG } from "./contracts";
import { sortTokens } from "./poolMath";

export interface PoolKeyState {
  currency0: `0x${string}`;
  currency1: `0x${string}`;
  fee: number;
  tickSpacing: number;
  hooks: `0x${string}`;
}

interface PoolKeyContextValue {
  poolKey: PoolKeyState | null;
  setPoolKey: (key: PoolKeyState | null) => void;
  // Build a PoolKey from two token addresses (handles sorting)
  buildPoolKey: (tokenA: string, tokenB: string, tickSpacing?: number) => PoolKeyState;
}

const PoolKeyContext = createContext<PoolKeyContextValue | null>(null);

export function PoolKeyProvider({ children }: { children: ReactNode }) {
  const [poolKey, setPoolKey] = useState<PoolKeyState | null>(null);

  const buildPoolKey = (tokenA: string, tokenB: string, tickSpacing = 60): PoolKeyState => {
    const [c0, c1] = sortTokens(tokenA as `0x${string}`, tokenB as `0x${string}`);
    return {
      currency0: c0,
      currency1: c1,
      fee: DYNAMIC_FEE_FLAG,
      tickSpacing,
      hooks: ADDRESSES.HOOK,
    };
  };

  return (
    <PoolKeyContext.Provider value={{ poolKey, setPoolKey, buildPoolKey }}>
      {children}
    </PoolKeyContext.Provider>
  );
}

export function usePoolKey() {
  const ctx = useContext(PoolKeyContext);
  if (!ctx) throw new Error("usePoolKey must be inside PoolKeyProvider");
  return ctx;
}
