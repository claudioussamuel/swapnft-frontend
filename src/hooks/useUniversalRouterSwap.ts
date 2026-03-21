"use client";

import { useState, useCallback } from "react";
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, useConfig } from "wagmi";
import {
  isAddress,
} from "viem";
import { getChainAddresses, ERC20_ABI, POOL_SWAP_TEST_ABI } from "@/lib/contracts";

import { waitForTransactionReceipt } from "@wagmi/core";

interface PoolKey {
  currency0: `0x${string}`;
  currency1: `0x${string}`;
  fee: number;
  tickSpacing: number;
  hooks: `0x${string}`;
}

interface UniswapV4SwapParams {
  poolKey: PoolKey;
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  amountIn: bigint;
  amountOutMinimum: bigint;
  zeroForOne: boolean;
}

export function useUniversalRouterSwap() {
  const { address } = useAccount();
  const chainId = useChainId();
  const addresses = getChainAddresses(chainId);
  const config = useConfig();

  const [txStep, setTxStep] = useState<"idle" | "permitting" | "swapping" | "pending" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState("");

  const { writeContractAsync } = useWriteContract();
  const { isSuccess: isMined } = useWaitForTransactionReceipt({ hash: txHash });

  // Step 1: Approve exact amount to PoolSwapTest
  const approveToken = useCallback(
    async (tokenIn: `0x${string}`, amountIn: bigint) => {
      if (!address || !isAddress(tokenIn)) return;

      try {
        setTxStep("permitting");
        setError("");

        // Approve token to PoolSwapTest
        const approveTx = await writeContractAsync({
          address: tokenIn,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [addresses.POOL_SWAP_TEST, BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")],
        });

        await waitForTransactionReceipt(config, { hash: approveTx });

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Approval failed");
        setTxStep("error");
        return false;
      }
    },
    [address, writeContractAsync, addresses]
  );

  // Step 2: Execute swap via PoolSwapTest
  const executeSwap = useCallback(
    async (params: UniswapV4SwapParams) => {
      if (!address || !isAddress(address)) return;

      try {
        setTxStep("swapping");
        setError("");

        const { poolKey, amountIn, zeroForOne } = params;

        // Calculate limits: using constants similar to SwapTokens.s.sol
        // MIN_PRICE_LIMIT = 4295128740
        // MAX_PRICE_LIMIT = 1461446703485210103287273052203988822378723970341
        // (Wait, MAX_PRICE_LIMIT needs BigInt string, see MIN_SQRT_PRICE and MAX_SQRT_PRICE in contracts.ts)
        const MIN_SQRT_PRICE = BigInt("4295128740");
        const MAX_SQRT_PRICE = BigInt("1461446703485210103287273052203988822378723970341");
        
        const sqrtPriceLimitX96 = zeroForOne ? MIN_SQRT_PRICE + BigInt(1) : MAX_SQRT_PRICE - BigInt(1);

        // amountSpecified is exact Input: negative amount for exact input?
        // Wait, in UniswapV4, exact input is negative.
        // SwapTokens.s.sol: int256 amountSpecified = -1e18;
        const amountSpecified = -amountIn;

        const swapParams = {
          zeroForOne,
          amountSpecified,
          sqrtPriceLimitX96,
        };

        const testSettings = {
          takeClaims: false,
          settleUsingBurn: false,
        };

        const hash = await writeContractAsync({
          address: addresses.POOL_SWAP_TEST,
          abi: POOL_SWAP_TEST_ABI,
          functionName: "swap",
          args: [
            {
              currency0: poolKey.currency0,
              currency1: poolKey.currency1,
              fee: poolKey.fee,
              tickSpacing: poolKey.tickSpacing,
              hooks: poolKey.hooks,
            },
            swapParams,
            testSettings,
            "0x"
          ],
        });

        setTxHash(hash);
        setTxStep("pending");
        return hash;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Swap execution failed");
        setTxStep("error");
        return undefined;
      }
    },
    [address, writeContractAsync, addresses]
  );

  // Combined swap function with approval check
  const swap = useCallback(
    async (params: UniswapV4SwapParams) => {
      // First approve
      const approved = await approveToken(params.tokenIn, params.amountIn);
      if (!approved) return;

      // Then execute swap
      return await executeSwap(params);
    },
    [approveToken, executeSwap]
  );

  return {
    swap,
    executeSwap,
    approveToken,
    txStep,
    txHash,
    error,
    isMined,
  };
}
