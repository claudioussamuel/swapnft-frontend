"use client";

import { useEffect, useState } from "react";
import { isAddress } from "viem";
import { useChainId } from "wagmi";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { TICK_SPACING_OPTIONS } from "@/lib/poolMath";
import { usePoolKey } from "@/lib/poolKeyStore";
import { getChainAddresses } from "@/lib/contracts";

export function PoolKeyForm({ onSet }: { onSet?: () => void }) {
  const { buildPoolKey, setPoolKey, poolKey } = usePoolKey();
  const chain = useChainId();
  const addresses = getChainAddresses(chain);
  const tokenA = addresses.TOKEN_ZERO;
  const tokenB = addresses.TOKEN_ONE;
  const [tickSpacing, setTickSpacing] = useState(poolKey?.tickSpacing ?? 60);
  const [errors, setErrors] = useState<{ a?: string; b?: string }>({});

  const infoA = useTokenInfo(tokenA);
  const infoB = useTokenInfo(tokenB);

  useEffect(() => {
    if (poolKey) return;
    if (!isAddress(tokenA) || !isAddress(tokenB)) return;
    setPoolKey(buildPoolKey(tokenA, tokenB, addresses.HOOK, tickSpacing));
  }, [poolKey, tokenA, tokenB, tickSpacing, addresses.HOOK, setPoolKey, buildPoolKey]);

  const handleSet = () => {
    const errs: typeof errors = {};
    if (!isAddress(tokenA)) errs.a = "Invalid address";
    if (!isAddress(tokenB)) errs.b = "Invalid address";
    if (tokenA.toLowerCase() === tokenB.toLowerCase()) {
      errs.a = "Must be different tokens";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setPoolKey(buildPoolKey(tokenA, tokenB, addresses.HOOK, tickSpacing));
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
            readOnly
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
            readOnly
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
        <span className="pool-key-form__hint">Auto-set on page load (with current tick spacing)</span>
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
            {addresses.HOOK.slice(0, 6)}…
          </span>
        </div>
      )}
    </div>
  );
}
