"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState } from "react";
import { ERC20_ABI, MAX_UINT256 } from "@/lib/contracts";
import { isAddress } from "viem";

export function useApproval(
  tokenAddress: string | undefined,
  ownerAddress: string | undefined,
  spender: `0x${string}`,
  requiredAmount?: bigint
) {
  const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | undefined>();
  const validToken = !!tokenAddress && isAddress(tokenAddress);
  const validOwner = !!ownerAddress && isAddress(ownerAddress);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: validToken ? (tokenAddress as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: validOwner && validToken
      ? [ownerAddress as `0x${string}`, spender]
      : undefined,
    query: { enabled: validToken && validOwner },
  });

  const { writeContractAsync } = useWriteContract();

  const { isLoading: isApproving, isSuccess: isApproved } =
    useWaitForTransactionReceipt({ hash: approveTxHash });

  const needsApproval =
    requiredAmount !== undefined &&
    allowance !== undefined &&
    (allowance as bigint) < requiredAmount;

  // Returns the tx hash so callers can await the receipt themselves (Bug 5 fix)
  const approve = async (): Promise<`0x${string}` | undefined> => {
    if (!validToken) return undefined;
    const hash = await writeContractAsync({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spender, MAX_UINT256],
    });
    setApproveTxHash(hash);
    return hash;
  };

  return {
    allowance: allowance as bigint | undefined,
    needsApproval,
    approve,
    isApproving,
    isApproved,
    refetchAllowance,
  };
}
