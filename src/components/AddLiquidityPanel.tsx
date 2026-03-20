"use client";

import { useState, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { usePoolKey } from "@/lib/poolKeyStore";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { useApproval } from "@/hooks/useApproval";
import { AmountInput } from "./AmountInput";
import { TxStatus } from "./TxStatus";
import {
  ADDRESSES,
  POOL_MANAGER_ABI,
} from "@/lib/contracts";

type TxStep = "idle" | "approving" | "confirm" | "pending" | "success" | "error";

// Common tick range presets
const RANGE_PRESETS = [
  { label: "Full range", tickLower: -887220, tickUpper: 887220 },
  { label: "±10%",       tickLower: -1000,   tickUpper: 1000   },
  { label: "±5%",        tickLower: -500,    tickUpper: 500    },
  { label: "±1%",        tickLower: -100,    tickUpper: 100    },
  { label: "Custom",     tickLower: null,    tickUpper: null   },
] as const;

export function AddLiquidityPanel() {
  const { address, isConnected } = useAccount();
  const { poolKey } = usePoolKey();

  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [rangeIdx, setRangeIdx] = useState(0);
  const [customLower, setCustomLower] = useState("-1200");
  const [customUpper, setCustomUpper] = useState("1200");
  const [txStep, setTxStep] = useState<TxStep>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState("");

  const info0 = useTokenInfo(poolKey?.currency0);
  const info1 = useTokenInfo(poolKey?.currency1);

  const amount0Parsed = amount0 && info0.decimals !== undefined
    ? parseUnits(amount0, info0.decimals) : undefined;
  const amount1Parsed = amount1 && info1.decimals !== undefined
    ? parseUnits(amount1, info1.decimals) : undefined;

  const approval0 = useApproval(poolKey?.currency0, address, ADDRESSES.POOL_MANAGER, amount0Parsed);
  const approval1 = useApproval(poolKey?.currency1, address, ADDRESSES.POOL_MANAGER, amount1Parsed);

  const { writeContractAsync } = useWriteContract();

  const selectedRange = RANGE_PRESETS[rangeIdx];
  const tickLower = selectedRange.tickLower !== null
    ? selectedRange.tickLower
    : parseInt(customLower) || -1200;
  const tickUpper = selectedRange.tickUpper !== null
    ? selectedRange.tickUpper
    : parseInt(customUpper) || 1200;

  // Estimate liquidity from amounts — simplified sqrt formula
  // In production use the v4 LiquidityAmounts library
  const estimatedLiquidity =
    amount0Parsed && amount1Parsed
      ? (amount0Parsed + amount1Parsed) / 2n  // placeholder
      : 0n;

  const reset = () => {
    setTxStep("idle");
    setTxHash(undefined);
    setAmount0("");
    setAmount1("");
    setError("");
  };

  const handleAdd = useCallback(async () => {
    if (!poolKey || !address || !amount0Parsed || !amount1Parsed) return;
    setError("");

    try {
      // Approve token0 if needed
      if (approval0.needsApproval) {
        setTxStep("approving");
        await approval0.approve();
        await approval0.refetchAllowance();
      }
      // Approve token1 if needed
      if (approval1.needsApproval) {
        setTxStep("approving");
        await approval1.approve();
        await approval1.refetchAllowance();
      }

      setTxStep("confirm");

      const hash = await writeContractAsync({
        address: ADDRESSES.POOL_MANAGER,
        abi: POOL_MANAGER_ABI,
        functionName: "modifyLiquidity",
        args: [
          poolKey,
          {
            tickLower,
            tickUpper,
            liquidityDelta: estimatedLiquidity > 0n ? estimatedLiquidity : 1000000n,
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
  }, [
    poolKey, address, amount0Parsed, amount1Parsed,
    approval0, approval1, tickLower, tickUpper,
    estimatedLiquidity, writeContractAsync,
  ]);

  if (!poolKey) {
    return <div className="panel-empty"><p>Set a pool key above to add liquidity.</p></div>;
  }

  return (
    <div className="panel">
      {/* Amounts */}
      <div className="panel__section">
        <p className="panel__section-title">Deposit amounts</p>
        <div className="panel__pair">
          <AmountInput
            label={`${info0.symbol ?? "Token 0"} amount`}
            tokenAddress={poolKey.currency0}
            value={amount0}
            onChange={setAmount0}
            symbol={info0.symbol}
          />
          <AmountInput
            label={`${info1.symbol ?? "Token 1"} amount`}
            tokenAddress={poolKey.currency1}
            value={amount1}
            onChange={setAmount1}
            symbol={info1.symbol}
          />
        </div>
      </div>

      {/* Tick range */}
      <div className="panel__section">
        <p className="panel__section-title">Price range</p>
        <div className="panel__range-chips">
          {RANGE_PRESETS.map((p, i) => (
            <button
              key={p.label}
              className={`chip ${rangeIdx === i ? "chip--active" : ""}`}
              onClick={() => setRangeIdx(i)}
              type="button"
            >
              {p.label}
            </button>
          ))}
        </div>

        {selectedRange.tickLower === null && (
          <div className="panel__custom-ticks">
            <div className="panel__tick-field">
              <label className="panel__tick-label">Tick lower</label>
              <input
                className="panel__tick-input"
                type="number"
                value={customLower}
                onChange={e => setCustomLower(e.target.value)}
              />
            </div>
            <div className="panel__tick-field">
              <label className="panel__tick-label">Tick upper</label>
              <input
                className="panel__tick-input"
                type="number"
                value={customUpper}
                onChange={e => setCustomUpper(e.target.value)}
              />
            </div>
          </div>
        )}

        {selectedRange.tickLower !== null && (
          <div className="panel__tick-display">
            <div className="panel__tick-stat">
              <span className="panel__tick-stat-label">Tick lower</span>
              <span className="panel__tick-stat-value">{tickLower.toLocaleString()}</span>
            </div>
            <div className="panel__tick-stat">
              <span className="panel__tick-stat-label">Tick upper</span>
              <span className="panel__tick-stat-value">{tickUpper.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <TxStatus
        status={txStep}
        txHash={txHash}
        successMessage="Liquidity added successfully."
        errorMessage={error || undefined}
        onReset={reset}
      />

      <button
        className={`btn btn--primary panel__cta ${txStep === "approving" || txStep === "confirm" || txStep === "pending" ? "btn--loading" : ""}`}
        onClick={handleAdd}
        disabled={
          !isConnected ||
          !amount0 || !amount1 ||
          parseFloat(amount0) <= 0 || parseFloat(amount1) <= 0 ||
          (txStep !== "idle" && txStep !== "error")
        }
        type="button"
      >
        {!isConnected
          ? "Connect wallet"
          : approval0.needsApproval || approval1.needsApproval
          ? "Approve tokens"
          : txStep === "approving" ? "Approving…"
          : txStep === "confirm"  ? "Confirm in wallet…"
          : txStep === "pending"  ? "Adding liquidity…"
          : txStep === "success"  ? "Add more"
          : "Add liquidity"}
      </button>
    </div>
  );
}
