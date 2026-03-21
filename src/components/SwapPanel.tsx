"use client";

import { useState, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { parseUnits } from "viem";
import { usePoolKey } from "@/lib/poolKeyStore";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useNFTStatus } from "@/hooks/useNFTStatus";
import { useUniversalRouterSwap } from "@/hooks/useUniversalRouterSwap";
import { AmountInput } from "./AmountInput";
import { TxStatus } from "./TxStatus";
import {
  getChainAddresses,
} from "@/lib/contracts";
import { formatFee } from "@/lib/poolMath";

export function SwapPanel() {
  const { address, isConnected } = useAccount();
  const chain = useChainId();
  const addresses = getChainAddresses(chain);
  const { poolKey } = usePoolKey();
  const { tier, meta, fee: previewFee, hasNFT } = useNFTStatus();

  const [amountIn, setAmountIn] = useState("");
  const [zeroForOne, setZeroForOne] = useState(true);

  const tokenIn = poolKey ? (zeroForOne ? poolKey.currency0 : poolKey.currency1) : undefined;
  const tokenOut = poolKey ? (zeroForOne ? poolKey.currency1 : poolKey.currency0) : undefined;

  const infoIn = useTokenInfo(tokenIn);
  const infoOut = useTokenInfo(tokenOut);
  const balIn = useTokenBalance(tokenIn, address);

  const amountInParsed = amountIn && infoIn.decimals !== undefined
    ? parseUnits(amountIn, infoIn.decimals)
    : undefined;

  // Use Universal Router swap flow with Permit2
  const { swap, txStep, txHash, error, isMined } = useUniversalRouterSwap();

  const reset = () => {
    setAmountIn("");
  };

  const flip = () => {
    setZeroForOne(prev => !prev);
    setAmountIn("");
  };

  const handleSwap = useCallback(async () => {
    if (!poolKey || !address || !amountInParsed || !tokenIn || !tokenOut) return;

    // Execute the Universal Router swap with Permit2
    await swap({
      poolKey,
      tokenIn: tokenIn as `0x${string}`,
      tokenOut: tokenOut as `0x${string}`,
      amountIn: amountInParsed,
      amountOutMinimum: BigInt(0), // Set slippage tolerance as needed
      zeroForOne,
    });

    balIn.refetch();
  }, [poolKey, address, amountInParsed, tokenIn, tokenOut, zeroForOne, swap, balIn]);

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
            <polygon points="7,1 8.8,4.8 13,5.5 10,8.4 10.7,12.6 7,10.6 3.3,12.6 4,8.4 1,5.5 5.2,4.8" fill="currentColor" />
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
            <path d="M9 2v14M4 12l5 5 5-5M4 6l5-5 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
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
      <p className="panel__note">Use the flip icon between input and output fields to swap direction.</p>

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
          (txStep !== "idle" && txStep !== "error" && txStep !== "success")
        }
        type="button"
      >
        {!isConnected
          ? "Connect wallet"
          : txStep === "permitting" ? "Approving…"
            : txStep === "swapping" ? "Confirm in wallet…"
              : txStep === "pending" ? "Swapping…"
                : txStep === "success" ? "Swap again"
                  : "Swap"}
      </button>
    </div>
  );
}
