"use client";

import { TIER_META } from "@/lib/contracts";
import { formatFee } from "@/lib/poolMath";
import { useNFTStatus } from "@/hooks/useNFTStatus";

const BASE_FEE = 3000;

export function TierTable() {
  const { tier: activeTier } = useNFTStatus();

  return (
    <div className="tier-table">
      <div className="tier-table__header">
        <span>Tier</span>
        <span>Price impact</span>
        <span>Discount</span>
        <span>Effective fee</span>
      </div>
      {TIER_META.slice(1).map((t) => {
        const effectiveFee = Math.max(1, Math.floor((BASE_FEE * (100 - t.discount)) / 100));
        const isActive = activeTier === t.tier;
        return (
          <div
            key={t.tier}
            className={`tier-table__row ${isActive ? "tier-table__row--active" : ""}`}
            style={{ "--tier-color": t.color } as React.CSSProperties}
          >
            <span className="tier-table__name">
              <span className="tier-table__dot" />
              {t.name}
            </span>
            <span className="tier-table__impact">{t.impact}</span>
            <span className="tier-table__discount">−{t.discount}%</span>
            <span className="tier-table__fee">{formatFee(effectiveFee)}</span>
            {isActive && <span className="tier-table__yours">yours</span>}
          </div>
        );
      })}
    </div>
  );
}
