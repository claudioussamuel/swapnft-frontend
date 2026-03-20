"use client";

import { useReadContracts } from "wagmi";
import { ERC20_ABI } from "@/lib/contracts";
import { isAddress } from "viem";

export function useTokenInfo(address: string | undefined) {
  const valid = !!address && isAddress(address);

  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: valid ? (address as `0x${string}`) : undefined,
        abi: ERC20_ABI,
        functionName: "symbol",
      },
      {
        address: valid ? (address as `0x${string}`) : undefined,
        abi: ERC20_ABI,
        functionName: "name",
      },
      {
        address: valid ? (address as `0x${string}`) : undefined,
        abi: ERC20_ABI,
        functionName: "decimals",
      },
    ],
    query: { enabled: valid },
  });

  return {
    symbol: data?.[0]?.result as string | undefined,
    name: data?.[1]?.result as string | undefined,
    decimals: data?.[2]?.result as number | undefined,
    isLoading,
    isValid: valid,
  };
}
