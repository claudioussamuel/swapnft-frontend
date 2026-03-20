"use client";

import { useNFTStatus } from "@/hooks/useNFTStatus";
import { formatFee } from "@/lib/poolMath";

export function NFTBadge() {
  const { tier, meta, fee, hasNFT } = useNFTStatus();

  if (!hasNFT) return null;

  return (
    <div className="nft-badge" style={{ "--tier-color": meta.color } as React.CSSProperties}>
      <div className="nft-badge__glow" />
      <div className="nft-badge__inner">
        <span className="nft-badge__label">Active NFT</span>
        <span className="nft-badge__tier">{meta.name}</span>
        <div className="nft-badge__stats">
          <span>{meta.discount}% fee discount</span>
          <span className="nft-badge__sep">·</span>
          <span>{formatFee(fee)} applied</span>
        </div>
      </div>
      <div className="nft-badge__icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill="currentColor"
            opacity="0.9"
          />
        </svg>
      </div>
    </div>
  );
}
