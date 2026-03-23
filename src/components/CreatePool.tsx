"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  getChainAddresses,
  POOL_MANAGER_ABI,
  DYNAMIC_FEE_FLAG,
} from "@/lib/contracts";
import {
  sortTokens,
  priceToSqrtPriceX96,
  SQRT_PRICE_1_1,
  TICK_SPACING_OPTIONS,
  INITIAL_PRICE_OPTIONS,
  derivePoolId,
} from "@/lib/poolMath";

type Step = "idle" | "confirm" | "pending" | "success" | "error";

export function CreatePool() {
  const { address, isConnected } = useAccount();
  const  chain  = useChainId();
  const addresses = getChainAddresses(chain);

  const token0 = addresses.TOKEN_ZERO;
  const token1 = addresses.TOKEN_ONE;
  const [tickSpacing, setTickSpacing] = useState(60);
  const [priceMode, setPriceMode] = useState<"preset" | "custom">("preset");
  const [presetPrice, setPresetPrice] = useState(0); // index into INITIAL_PRICE_OPTIONS
  const [customPrice, setCustomPrice] = useState("1");
  const [step, setStep] = useState<Step>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [poolId, setPoolId] = useState<`0x${string}` | undefined>();
  const [errors, setErrors] = useState<{ token0?: string; token1?: string; price?: string; txError?: string }>({});

  // ── Wagmi write ───────────────────────────────────────────────────────────
  const { writeContractAsync } = useWriteContract();
  const { isLoading: isMining, isSuccess: isMined } = useWaitForTransactionReceipt({ hash: txHash });

  // Transition to success only after tx is confirmed on-chain (Bug 2 fix)
  useEffect(() => {
    if (isMined && step === "pending") setStep("success");
  }, [isMined, step]);

  // ── Derived values ────────────────────────────────────────────────────────
  const sqrtPriceX96 =
    priceMode === "preset"
      ? INITIAL_PRICE_OPTIONS[presetPrice].sqrtPriceX96
      : priceToSqrtPriceX96(parseFloat(customPrice) || 1);

  const validate = useCallback(() => {
    const errs: typeof errors = {};
    if (priceMode === "custom") {
      const p = parseFloat(customPrice);
      if (isNaN(p) || p <= 0) errs.price = "Enter a positive price";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [customPrice, priceMode]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!validate()) return;
    if (!isConnected) return;

    const [currency0, currency1] = sortTokens(
      token0 as `0x${string}`,
      token1 as `0x${string}`
    );

    const poolKey = {
      currency0,
      currency1,
      fee: DYNAMIC_FEE_FLAG,
      tickSpacing,
      hooks: addresses.HOOK,
    };

    setStep("confirm");

    try {
      const hash = await writeContractAsync({
        address: addresses.POOL_MANAGER,
        abi: POOL_MANAGER_ABI,
        functionName: "initialize",
        args: [poolKey, sqrtPriceX96],
      });

      setTxHash(hash);
      // Derive pool ID immediately (doesn't need waiting)
      const id = derivePoolId(currency0, currency1, DYNAMIC_FEE_FLAG, tickSpacing, addresses.HOOK);
      setPoolId(id);
      setStep("pending"); // success is set by the useEffect above once isMined
    } catch (e: unknown) {
      console.error(e);
      let errMsg = String(e);
      if (e instanceof Error) {
        errMsg = (e as any).shortMessage || e.message || errMsg;
      }
      setErrors((prev) => ({ ...prev, txError: errMsg }));
      setStep("error");
    }
  };

  const reset = () => {
    setStep("idle");
    setTxHash(undefined);
    setPoolId(undefined);
    setErrors({});
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="create-pool__success">
        <div className="create-pool__success-icon">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="19" stroke="var(--accent)" strokeWidth="1.5" />
            <path d="M12 20l6 6 10-12" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="create-pool__success-title">Pool created</h2>
        <p className="create-pool__success-sub">
          Your Uniswap v4 pool with the SwapImpact hook is live.
        </p>
        <div className="create-pool__success-data">
          {txHash && (
            <div className="create-pool__datum">
              <span className="create-pool__datum-label">Tx hash</span>
              <span className="create-pool__datum-value create-pool__datum-value--mono">
                {txHash.slice(0, 10)}…{txHash.slice(-8)}
              </span>
            </div>
          )}
          {poolId && (
            <div className="create-pool__datum">
              <span className="create-pool__datum-label">Pool ID</span>
              <span className="create-pool__datum-value create-pool__datum-value--mono">
                {poolId.slice(0, 10)}…{poolId.slice(-8)}
              </span>
            </div>
          )}
          <div className="create-pool__datum">
            <span className="create-pool__datum-label">Hook</span>
            <span className="create-pool__datum-value create-pool__datum-value--mono">
                {addresses.HOOK.slice(0, 10)}…{addresses.HOOK.slice(-8)}
            </span>
          </div>
        </div>
        <button className="btn btn--ghost" onClick={reset}>
          Create another pool
        </button>
      </div>
    );
  }

  return (
    <div className="create-pool">
      <div className="create-pool__section">
        <h3 className="create-pool__section-title">Token pair</h3>
        <div className="create-pool__pair">
          <div className="token-input">
            <label className="token-input__label">Token A</label>
            <div className="token-input__field token-input__field--readonly">
              {token0}
            </div>
          </div>
          <div className="create-pool__pair-divider">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M3 9l5 5 5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="token-input">
            <label className="token-input__label">Token B</label>
            <div className="token-input__field token-input__field--readonly">
              {token1}
            </div>
          </div>
        </div>
      </div>

      <div className="create-pool__section">
        <h3 className="create-pool__section-title">Pool parameters</h3>

        <div className="create-pool__field">
          <label className="create-pool__label">Tick spacing</label>
          <div className="create-pool__chips">
            {TICK_SPACING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`chip ${tickSpacing === opt.value ? "chip--active" : ""}`}
                onClick={() => setTickSpacing(opt.value)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="create-pool__field">
          <label className="create-pool__label">Initial price</label>
          <div className="create-pool__chips">
            {INITIAL_PRICE_OPTIONS.map((opt, i) => (
              <button
                key={opt.label}
                className={`chip ${priceMode === "preset" && presetPrice === i ? "chip--active" : ""}`}
                onClick={() => { setPriceMode("preset"); setPresetPrice(i); }}
                type="button"
              >
                {opt.label}
              </button>
            ))}
            <button
              className={`chip ${priceMode === "custom" ? "chip--active" : ""}`}
              onClick={() => setPriceMode("custom")}
              type="button"
            >
              Custom
            </button>
          </div>
          {priceMode === "custom" && (
            <div className="create-pool__custom-price">
              <input
                className="create-pool__price-input"
                type="number"
                min="0"
                step="any"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="e.g. 1.5"
              />
              <span className="create-pool__price-unit">token1 per token0</span>
              {errors.price && <p className="create-pool__error">{errors.price}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="create-pool__section create-pool__section--hook">
        <div className="create-pool__hook-badge">
          <div className="create-pool__hook-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1l2.47 5.01L17 6.88l-4 3.9.94 5.5L9 13.77l-4.94 2.5.94-5.5L1 6.88l5.53-.87L9 1z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <p className="create-pool__hook-name">SwapImpact Fees Hook</p>
            <p className="create-pool__hook-addr">
              {addresses.HOOK.slice(0, 6)}…{addresses.HOOK.slice(-4)}
            </p>
          </div>
          <span className="create-pool__hook-pill">attached</span>
        </div>
        <p className="create-pool__hook-desc">
          Mints tier NFTs based on price impact. Holders receive fee discounts (20–90%) on their next swap, then the NFT is burned.
        </p>
      </div>

      <button
        className={`btn btn--primary create-pool__submit ${step === "confirm" || step === "pending" ? "btn--loading" : ""}`}
        onClick={handleCreate}
        disabled={!isConnected || step === "confirm" || step === "pending"}
        type="button"
      >
        {!isConnected
          ? "Connect wallet to continue"
          : step === "confirm"
          ? "Confirm in wallet…"
          : step === "pending"
          ? "Creating pool…"
          : "Create pool"}
      </button>

      {step === "error" && (
        <div className="create-pool__error create-pool__error--tx">
          <p>Transaction failed or was rejected. Check your wallet and try again.</p>
          {errors.txError && (
            <pre style={{ marginTop: "0.5rem", fontSize: "0.85em", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {errors.txError}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
