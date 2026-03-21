"use client";

import { useState, useEffect } from "react";
import { useChainId } from "wagmi";
import { Navbar } from "@/components/Navbar";
import { SwapPanel } from "@/components/SwapPanel";
import { AddLiquidityPanel } from "@/components/AddLiquidityPanel";
import { RemoveLiquidityPanel } from "@/components/RemoveLiquidityPanel";
import { TierTable } from "@/components/TierTable";
import { usePoolKey } from "@/lib/poolKeyStore";
import { getChainAddresses } from "@/lib/contracts";
import Link from "next/link";

type Tab = "swap" | "add" | "remove";

export default function PoolPage() {
  const [tab, setTab] = useState<Tab>("swap");
  const { poolKey, setPoolKey, buildPoolKey } = usePoolKey();
  const  chain  = useChainId();
  const addresses = getChainAddresses(chain);

  useEffect(() => {
    if (poolKey) return;
    const tokenA = addresses.TOKEN_ZERO;
    const tokenB = addresses.TOKEN_ONE;
    if (!tokenA || !tokenB) return;
    setPoolKey(buildPoolKey(tokenA, tokenB, 60));
  }, [poolKey, addresses.TOKEN_ZERO, addresses.TOKEN_ONE, setPoolKey, buildPoolKey]);

  return (
    <div className="app">
      <Navbar />

      <main className="main">
        {/* Page header */}
        <div className="page-header">
          <div>
            <div className="page-header__eyebrow">
              <Link href="/" className="page-header__back">
                ← Create pool
              </Link>
            </div>
            <h1 className="page-header__title">Pool</h1>
            <p className="page-header__sub">
              Swap, add, or remove liquidity. Swaps earn and redeem tier NFTs automatically.
            </p>
          </div>
        </div>

        {/* Pool key is auto-selected from chain addresses (no manual pool key form needed) */}

        <div className="pool-grid">
          {/* Left: tab panels */}
          <div className="card card--main">
            {/* Tab bar */}
            <div className="tab-bar">
              {(["swap", "add", "remove"] as Tab[]).map(t => (
                <button
                  key={t}
                  className={`tab-bar__tab ${tab === t ? "tab-bar__tab--active" : ""}`}
                  onClick={() => setTab(t)}
                  type="button"
                >
                  {t === "swap"   ? "Swap"
                  : t === "add"   ? "Add liquidity"
                  : "Remove liquidity"}
                </button>
              ))}
            </div>

            {tab === "swap"   && <SwapPanel />}
            {tab === "add"    && <AddLiquidityPanel />}
            {tab === "remove" && <RemoveLiquidityPanel />}
          </div>

          {/* Right sidebar */}
          <div className="sidebar">
            {poolKey && (
              <div className="card">
                <div className="card__header">
                  <h2 className="card__title">Pool info</h2>
                </div>
                <div className="pool-info-list">
                  <div className="pool-info-item">
                    <span className="pool-info-item__label">Currency 0</span>
                    <span className="pool-info-item__value pool-info-item__value--mono">
                      {poolKey.currency0.slice(0, 8)}…{poolKey.currency0.slice(-6)}
                    </span>
                  </div>
                  <div className="pool-info-item">
                    <span className="pool-info-item__label">Currency 1</span>
                    <span className="pool-info-item__value pool-info-item__value--mono">
                      {poolKey.currency1.slice(0, 8)}…{poolKey.currency1.slice(-6)}
                    </span>
                  </div>
                  <div className="pool-info-item">
                    <span className="pool-info-item__label">Fee</span>
                    <span className="pool-info-item__value">Dynamic (hook controlled)</span>
                  </div>
                  <div className="pool-info-item">
                    <span className="pool-info-item__label">Tick spacing</span>
                    <span className="pool-info-item__value">{poolKey.tickSpacing}</span>
                  </div>
                  <div className="pool-info-item">
                    <span className="pool-info-item__label">Hook</span>
                    <span className="pool-info-item__value pool-info-item__value--mono pool-info-item__value--accent">
                      {addresses.HOOK.slice(0, 8)}…{addresses.HOOK.slice(-6)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="card__header">
                <h2 className="card__title">Impact tiers</h2>
                <p className="card__sub">Earned per swap, applied to the next</p>
              </div>
              <TierTable />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
