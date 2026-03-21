"use client";

import { useState, useCallback } from "react";
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { usePoolKey } from "@/lib/poolKeyStore";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { TxStatus } from "./TxStatus";
import {
  getChainAddresses,
  POOL_MANAGER_ABI,
} from "@/lib/contracts";

type TxStep = "idle" | "confirm" | "pending" | "success" | "error";

export function RemoveLiquidityPanel() {
  const { address, isConnected } = useAccount();
  const chain = useChainId();
  const addresses = getChainAddresses(chain);
  const { poolKey } = usePoolKey();

  // In a real app these would come from reading the user's positions
  // via the PositionManager NFT or ERC6909 claims
  const [tickLower, setTickLower] = useState("-1200");
  const [tickUpper, setTickUpper] = useState("1200");
  const [liquidityAmount, setLiquidityAmount] = useState("");
  const [percentage, setPercentage] = useState(100);
  const [txStep, setTxStep] = useState<TxStep>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState("");

  const info0 = useTokenInfo(poolKey?.currency0);
  const info1 = useTokenInfo(poolKey?.currency1);

  const { writeContractAsync } = useWriteContract();

  const reset = () => {
    setTxStep("idle");
    setTxHash(undefined);
    setError("");
  };

  const parsedLiquidity = liquidityAmount
    ? BigInt(Math.floor(parseFloat(liquidityAmount) * (percentage / 100)))
    : BigInt(0);

  const handleRemove = useCallback(async () => {
    if (!poolKey || !address || !liquidityAmount) return;
    setError("");

    try {
      setTxStep("confirm");

      const hash = await writeContractAsync({
        address: addresses.POOL_MANAGER,
        abi: POOL_MANAGER_ABI,
        functionName: "modifyLiquidity",
        args: [
          poolKey,
          {
            tickLower: parseInt(tickLower),
            tickUpper: parseInt(tickUpper),
            liquidityDelta: -parsedLiquidity, // negative = remove
            salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
          },
          "0x",
        ],
      });

      setTxHash(hash);
      setTxStep("success");
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Unknown error");
      setTxStep("error");
    }
  }, [poolKey, address, liquidityAmount, tickLower, tickUpper, parsedLiquidity, writeContractAsync]);

  if (!poolKey) {
    return <div className="panel-empty"><p>Set a pool key above to remove liquidity.</p></div>;
  }

  return (
    <div className="panel">
      <div className="panel__info-box">
        <p className="panel__info-title">Your position</p>
        <p className="panel__info-sub">
          Enter your position's tick range and liquidity amount. You can find these
          by looking up your position in the PositionManager contract or using
          the pool explorer.
        </p>
      </div>

      {/* Tick range */}
      <div className="panel__section">
        <p className="panel__section-title">Position tick range</p>
        <div className="panel__custom-ticks">
          <div className="panel__tick-field">
            <label className="panel__tick-label">Tick lower</label>
            <input
              className="panel__tick-input"
              type="number"
              value={tickLower}
              onChange={e => setTickLower(e.target.value)}
            />
          </div>
          <div className="panel__tick-field">
            <label className="panel__tick-label">Tick upper</label>
            <input
              className="panel__tick-input"
              type="number"
              value={tickUpper}
              onChange={e => setTickUpper(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Liquidity */}
      <div className="panel__section">
        <p className="panel__section-title">Liquidity to remove</p>
        <div className="panel__liquidity-row">
          <input
            className="panel__tick-input panel__tick-input--wide"
            type="number"
            min="0"
            step="any"
            placeholder="Total liquidity units"
            value={liquidityAmount}
            onChange={e => setLiquidityAmount(e.target.value)}
          />
        </div>

        {/* Percentage slider */}
        <div className="panel__pct-row">
          <span className="panel__pct-label">{percentage}% of position</span>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={percentage}
            onChange={e => setPercentage(parseInt(e.target.value))}
            className="panel__slider"
          />
          <div className="panel__pct-chips">
            {[25, 50, 75, 100].map(p => (
              <button
                key={p}
                className={`chip chip--sm ${percentage === p ? "chip--active" : ""}`}
                onClick={() => setPercentage(p)}
                type="button"
              >
                {p}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* What you'll receive */}
      {liquidityAmount && parseFloat(liquidityAmount) > 0 && (
        <div className="panel__receive-summary">
          <p className="panel__section-title">You will receive</p>
          <div className="panel__receive-row">
            <span className="panel__receive-token-name">{info0.symbol ?? "Token 0"}</span>
            <span className="panel__receive-amount">~</span>
          </div>
          <div className="panel__receive-row">
            <span className="panel__receive-token-name">{info1.symbol ?? "Token 1"}</span>
            <span className="panel__receive-amount">~</span>
          </div>
          <p className="panel__receive-note">Exact amounts determined at execution</p>
        </div>
      )}

      <TxStatus
        status={txStep}
        txHash={txHash}
        successMessage="Liquidity removed. Tokens returned to your wallet."
        errorMessage={error || undefined}
        onReset={reset}
      />

      <button
        className={`btn btn--primary panel__cta ${txStep === "confirm" || txStep === "pending" ? "btn--loading" : ""}`}
        onClick={handleRemove}
        disabled={
          !isConnected ||
          !liquidityAmount || parseFloat(liquidityAmount) <= 0 ||
          (txStep !== "idle" && txStep !== "error")
        }
        type="button"
      >
        {!isConnected
          ? "Connect wallet"
          : txStep === "confirm" ? "Confirm in wallet…"
            : txStep === "pending" ? "Removing…"
              : txStep === "success" ? "Remove more"
                : `Remove ${percentage < 100 ? percentage + "% of" : "all"} liquidity`}
      </button>
    </div>
  );
}
