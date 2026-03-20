"use client";

import { useAccount, useNetwork, useReadContract } from "wagmi";
import { getChainAddresses, NFT_ABI, HOOK_ABI, TIER_META } from "@/lib/contracts";

export function useNFTStatus() {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const addresses = getChainAddresses(chain?.id);

  const { data: bestTier, refetch: refetchTier } = useReadContract({
    address: addresses.NFT,
    abi: NFT_ABI,
    functionName: "bestTierOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: feePreview, refetch: refetchFee } = useReadContract({
    address: addresses.HOOK,
    abi: HOOK_ABI,
    functionName: "previewFee",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const tier = Number(bestTier ?? 0);
  const meta = TIER_META[tier] ?? TIER_META[0];
  const fee = feePreview ? Number(feePreview[0]) : 3000;
  const hasNFT = tier > 0;

  const refetch = () => {
    refetchTier();
    refetchFee();
  };

  return { tier, meta, fee, hasNFT, refetch };
}
