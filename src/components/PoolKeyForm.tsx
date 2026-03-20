"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { TICK_SPACING_OPTIONS } from "@/lib/poolMath";
import { usePoolKey } from "@/lib/poolKeyStore";
import { ADDRESSES } from "@/lib/contracts";

export function PoolKeyForm({ onSet }: { onSet?: () => void }) {
  const { buildPoolKey, setPoolKey, poolKey } = usePoolKey();
  const [tokenA, setTokenA] = useState(poolKey ? poolKey.currency0 : "");
  const [tokenB, setTokenB] = useState(poolKey ? poolKey.currency1 : "");
  const [tickSpacing, setTickSpacing] = useState(poolKey?.tickSpacing ?? 60);
  const [errors, setErrors] = useState<{ a?: string; b?: string }>({});

  const infoA = useTokenInfo(tokenA);
  const infoB = useTokenInfo(tokenB);

  const handleSet = () => {
    const errs: typeof errors = {};
    if (!isAddress(tokenA)) errs.a = "Invalid address";
    if (!isAddress(tokenB)) errs.b = "Invalid address";
    if (tokenA.toLowerCase() === tokenB.toLowerCase()) {
      errs.a = "Must be different tokens";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setPoolKey(buildPoolKey(tokenA, tokenB, tickSpacing));
    onSet?.();
  };

  return (
    <div className="pool-key-form">
      <p className="pool-key-form__label">Pool key</p>
      <div className="pool-key-form__row">
        <div className="pool-key-form__field">
          <input
            className={`pki ${errors.a ? "pki--error" : infoA.symbol ? "pki--valid" : ""}`}
            value={tokenA}
            onChange={e => setTokenA(e.target.value)}
            placeholder="Token A address"
            spellCheck={false}
          />
          {infoA.symbol && <span className="pki__tag">{infoA.symbol}</span>}
          {errors.a && <p className="pki__err">{errors.a}</p>}
        </div>

        <div className="pool-key-form__divider">/</div>

        <div className="pool-key-form__field">
          <input
            className={`pki ${errors.b ? "pki--error" : infoB.symbol ? "pki--valid" : ""}`}
            value={tokenB}
            onChange={e => setTokenB(e.target.value)}
            placeholder="Token B address"
            spellCheck={false}
          />
          {infoB.symbol && <span className="pki__tag">{infoB.symbol}</span>}
          {errors.b && <p className="pki__err">{errors.b}</p>}
        </div>

        <div className="pool-key-form__spacing">
          {TICK_SPACING_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`chip chip--sm ${tickSpacing === opt.value ? "chip--active" : ""}`}
              onClick={() => setTickSpacing(opt.value)}
              type="button"
            >
              {opt.value}
            </button>
          ))}
        </div>

        <button className="btn btn--ghost btn--sm" onClick={handleSet} type="button">
          Set pool
        </button>
      </div>

      {poolKey && (
        <div className="pool-key-form__active">
          <span className="pool-key-form__active-dot" />
          <span className="pool-key-form__active-text">
            {infoA.symbol ?? poolKey.currency0.slice(0, 6)}
            {" / "}
            {infoB.symbol ?? poolKey.currency1.slice(0, 6)}
            {" · tick "}
            {poolKey.tickSpacing}
            {" · hook "}
            {ADDRESSES.HOOK.slice(0, 6)}…
          </span>
        </div>
      )}
    </div>
  );
}
