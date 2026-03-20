"use client";

import { useReadContracts } from "wagmi";
import { ERC20_ABI } from "@/lib/contracts";
import { isAddress, formatUnits } from "viem";

export function useTokenBalance(
  tokenAddress: string | undefined,
  ownerAddress: string | undefined
) {
  const validToken = !!tokenAddress && isAddress(tokenAddress);
  const validOwner = !!ownerAddress && isAddress(ownerAddress);
  const enabled = validToken && validOwner;

  const { data, refetch } = useReadContracts({
    contracts: [
      {
        address: enabled ? (tokenAddress as `0x${string}`) : undefined,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: enabled ? [ownerAddress as `0x${string}`] : undefined,
      },
      {
        address: enabled ? (tokenAddress as `0x${string}`) : undefined,
        abi: ERC20_ABI,
        functionName: "decimals",
      },
      {
        address: enabled ? (tokenAddress as `0x${string}`) : undefined,
        abi: ERC20_ABI,
        functionName: "symbol",
      },
    ],
    query: { enabled },
  });

  const rawBalance = data?.[0]?.result as bigint | undefined;
  const decimals = (data?.[1]?.result as number | undefined) ?? 18;
  const symbol = data?.[2]?.result as string | undefined;

  const formatted = rawBalance !== undefined
    ? parseFloat(formatUnits(rawBalance, decimals)).toFixed(4)
    : undefined;

  return { rawBalance, formatted, decimals, symbol, refetch };
}
