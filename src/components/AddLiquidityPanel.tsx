"use client";

import { useState, useCallback } from "react";
import { useAccount, useChainId, useWriteContract, useConfig } from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { parseUnits } from "viem";
import { usePoolKey } from "@/lib/poolKeyStore";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { useApproval } from "@/hooks/useApproval";
import { bigIntSqrt } from "@/lib/poolMath";
import { AmountInput } from "./AmountInput";
import { TxStatus } from "./TxStatus";
import {
  getChainAddresses,
  POOL_MODIFY_LIQUIDITY_TEST_ABI,
} from "@/lib/contracts";

type TxStep = "idle" | "approving" | "confirm" | "pending" | "success" | "error";

// Common tick range presets
const RANGE_PRESETS = [
  { label: "Full range", tickLower: -887220, tickUpper: 887220 },
  { label: "±10%", tickLower: -1000, tickUpper: 1000 },
  { label: "±5%", tickLower: -500, tickUpper: 500 },
  { label: "±1%", tickLower: -100, tickUpper: 100 },
  { label: "Custom", tickLower: null, tickUpper: null },
] as const;


export function AddLiquidityPanel() {
  const { address, isConnected } = useAccount();
  const chain = useChainId();
  const addresses = getChainAddresses(chain);
  const { poolKey } = usePoolKey();
  const config = useConfig();

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

  // Bug fix: Uniswap v4's test router uses plain ERC20 transferFrom. 
  // We approve the POOL_MODIFY_LIQUIDITY_TEST router instead of PERMIT2.
  const approval0 = useApproval(poolKey?.currency0, address, addresses.POOL_MODIFY_LIQUIDITY_TEST, amount0Parsed);
  const approval1 = useApproval(poolKey?.currency1, address, addresses.POOL_MODIFY_LIQUIDITY_TEST, amount1Parsed);

  const { writeContractAsync } = useWriteContract();

  const selectedRange = RANGE_PRESETS[rangeIdx];
  const tickLower = selectedRange.tickLower !== null
    ? selectedRange.tickLower
    : parseInt(customLower) || -1200;
  const tickUpper = selectedRange.tickUpper !== null
    ? selectedRange.tickUpper
    : parseInt(customUpper) || 1200;

  // Bug 4 fix: Use sqrt(amount0 * amount1) instead of the wrong average formula.
  // This is a reasonable approximation of the LP liquidity for a given price range.
  const estimatedLiquidity =
    amount0Parsed && amount1Parsed && amount0Parsed > BigInt(0) && amount1Parsed > BigInt(0)
      ? bigIntSqrt(amount0Parsed * amount1Parsed)
      : BigInt(0);

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
      // ── Step 1: ERC20 → Permit2 approvals (Bug 3 & 5 fix) ─────────────────
      if (approval0.needsApproval) {
        setTxStep("approving");
        const hash = await approval0.approve();
        if (hash) {
          // Bug 5 fix: Wait for the approval tx to be mined before refetching
          await waitForTransactionReceipt(config, { hash });
        }
        await approval0.refetchAllowance();
      }
      if (approval1.needsApproval) {
        setTxStep("approving");
        const hash = await approval1.approve();
        if (hash) {
          await waitForTransactionReceipt(config, { hash });
        }
        await approval1.refetchAllowance();
      }

      // ── Step 2: Execute modifyLiquidity on the Test Router ──────────────────
      setTxStep("confirm");

      const liquidityDelta = estimatedLiquidity > BigInt(0) ? estimatedLiquidity : BigInt(1_000_000);

      const hash = await writeContractAsync({
        address: addresses.POOL_MODIFY_LIQUIDITY_TEST,
        abi: POOL_MODIFY_LIQUIDITY_TEST_ABI,
        functionName: 'modifyLiquidity',
        args: [
          {
            currency0: poolKey.currency0,
            currency1: poolKey.currency1,
            fee: poolKey.fee,
            tickSpacing: poolKey.tickSpacing,
            hooks: poolKey.hooks,
          },
          {
            tickLower,
            tickUpper,
            liquidityDelta,
            salt: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
          },
          '0x',
        ],
      });

      setTxHash(hash);
      setTxStep("pending");

      await waitForTransactionReceipt(config, { hash });
      setTxStep("success");
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Unknown error");
      setTxStep("error");
    }
  }, [
    poolKey, address, amount0Parsed, amount1Parsed,
    approval0, approval1, tickLower, tickUpper,
    estimatedLiquidity, writeContractAsync, addresses,
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
          : txStep === "approving" ? "Approving…"
            : txStep === "confirm" ? "Confirm in wallet…"
              : txStep === "pending" ? "Adding liquidity…"
                : txStep === "success" ? "Add more"
                  : "Add liquidity"}
      </button>
    </div>
  );
}
