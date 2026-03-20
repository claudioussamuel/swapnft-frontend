"use client";

import { useState, useCallback } from "react";
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, encodeAbiParameters, parseAbiParameters } from "viem";
import { usePoolKey } from "@/lib/poolKeyStore";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useApproval } from "@/hooks/useApproval";
import { useNFTStatus } from "@/hooks/useNFTStatus";
import { AmountInput } from "./AmountInput";
import { TxStatus } from "./TxStatus";
import {
  getChainAddresses,
  POOL_MANAGER_ABI,
  MIN_SQRT_PRICE,
  MAX_SQRT_PRICE,
} from "@/lib/contracts";
import { formatFee } from "@/lib/poolMath";

type TxStep = "idle" | "approving" | "confirm" | "pending" | "success" | "error";

export function SwapPanel() {
  const { address, isConnected } = useAccount();
  const  chain  = useChainId();
  const addresses = getChainAddresses(chain);
  const { poolKey } = usePoolKey();
  const { tier, meta, fee: previewFee, hasNFT } = useNFTStatus();

  const [amountIn, setAmountIn] = useState("");
  const [zeroForOne, setZeroForOne] = useState(true);
  const [txStep, setTxStep] = useState<TxStep>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState("");

  const tokenIn  = poolKey ? (zeroForOne ? poolKey.currency0 : poolKey.currency1) : undefined;
  const tokenOut = poolKey ? (zeroForOne ? poolKey.currency1 : poolKey.currency0) : undefined;

  const infoIn  = useTokenInfo(tokenIn);
  const infoOut = useTokenInfo(tokenOut);
  const balIn   = useTokenBalance(tokenIn, address);

  const amountInParsed = amountIn && infoIn.decimals !== undefined
    ? parseUnits(amountIn, infoIn.decimals)
    : undefined;

  const { needsApproval, approve, isApproving, refetchAllowance } = useApproval(
    tokenIn,
    address,
    addresses.POOL_MANAGER,
    amountInParsed
  );

  const { writeContractAsync } = useWriteContract();
  const { isSuccess: isMined } = useWaitForTransactionReceipt({ hash: txHash });

  const reset = () => {
    setTxStep("idle");
    setTxHash(undefined);
    setAmountIn("");
    setError("");
  };

  const flip = () => {
    setZeroForOne(prev => !prev);
    setAmountIn("");
  };

  const handleSwap = useCallback(async () => {
    if (!poolKey || !address || !amountInParsed) return;
    setError("");

    try {
      if (needsApproval) {
        setTxStep("approving");
        await approve();
        await refetchAllowance();
      }

      setTxStep("confirm");

      // hookData must carry the real swapper address
      const hookData = encodeAbiParameters(
        parseAbiParameters("address"),
        [address]
      );

      const hash = await writeContractAsync({
        address: addresses.POOL_MANAGER,
        abi: POOL_MANAGER_ABI,
        functionName: "swap",
        args: [
          poolKey,
          {
            zeroForOne,
            amountSpecified: -amountInParsed, // negative = exact input
            sqrtPriceLimitX96: zeroForOne ? MIN_SQRT_PRICE + BigInt(1) : MAX_SQRT_PRICE - BigInt(1), // just inside the valid range to avoid front-running issues
          },
          hookData,
        ],
      });

      setTxHash(hash);
      setTxStep("pending");

      // optimistically move to success; useWaitForTransactionReceipt handles mining
      setTxStep("success");
      balIn.refetch();
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Unknown error");
      setTxStep("error");
    }
  }, [poolKey, address, amountInParsed, zeroForOne, needsApproval, approve, refetchAllowance, writeContractAsync, balIn]);

  if (!poolKey) {
    return (
      <div className="panel-empty">
        <p>Set a pool key above to start swapping.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      {/* NFT discount notice */}
      {hasNFT && (
        <div className="panel__nft-notice" style={{ "--tier-color": meta.color } as React.CSSProperties}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <polygon points="7,1 8.8,4.8 13,5.5 10,8.4 10.7,12.6 7,10.6 3.3,12.6 4,8.4 1,5.5 5.2,4.8" fill="currentColor"/>
          </svg>
          <span>
            <strong>{meta.name}</strong> NFT active — this swap will cost{" "}
            <strong>{formatFee(previewFee)}</strong> instead of 0.30%. NFT burns after.
          </span>
        </div>
      )}

      {/* Token amounts */}
      <div className="panel__swap-box">
        <AmountInput
          label={`You pay`}
          tokenAddress={tokenIn ?? ""}
          value={amountIn}
          onChange={setAmountIn}
          symbol={infoIn.symbol}
        />

        <button className="panel__flip" onClick={flip} type="button" title="Flip tokens">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2v14M4 12l5 5 5-5M4 6l5-5 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="panel__receive-box">
          <p className="amount-input__label">You receive</p>
          <div className="panel__receive-token">
            <span className="panel__receive-placeholder">~</span>
            <span className="amount-input__symbol">{infoOut.symbol ?? "?"}</span>
          </div>
          <p className="panel__receive-note">Exact amount determined at execution</p>
        </div>
      </div>

      {/* Fee line */}
      <div className="panel__fee-row">
        <span className="panel__fee-label">Fee</span>
        <span className="panel__fee-value">
          {formatFee(previewFee)}
          {hasNFT && (
            <span className="panel__fee-base"> (base 0.30%)</span>
          )}
        </span>
      </div>

      {/* Direction info */}
      <div className="panel__direction">
        <span className="panel__direction-label">Direction</span>
        <span className="panel__direction-value">
          {infoIn.symbol ?? "token0"} → {infoOut.symbol ?? "token1"}
        </span>
      </div>

      <TxStatus
        status={txStep}
        txHash={txHash}
        successMessage="Swap confirmed. Check your NFT status in the navbar."
        errorMessage={error || undefined}
        onReset={reset}
      />

      <button
        className={`btn btn--primary panel__cta ${txStep !== "idle" && txStep !== "error" && txStep !== "success" ? "btn--loading" : ""}`}
        onClick={handleSwap}
        disabled={
          !isConnected ||
          !amountIn ||
          parseFloat(amountIn) <= 0 ||
          (txStep !== "idle" && txStep !== "error")
        }
        type="button"
      >
        {!isConnected
          ? "Connect wallet"
          : needsApproval
          ? `Approve ${infoIn.symbol ?? "token"}`
          : txStep === "approving" ? "Approving…"
          : txStep === "confirm"  ? "Confirm in wallet…"
          : txStep === "pending"  ? "Swapping…"
          : txStep === "success"  ? "Swap again"
          : "Swap"}
      </button>
    </div>
  );
}
