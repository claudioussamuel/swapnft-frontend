"use client";

import { useAccount } from "wagmi";
import { useTokenBalance } from "@/hooks/useTokenBalance";

interface AmountInputProps {
  label: string;
  tokenAddress: string;
  value: string;
  onChange: (v: string) => void;
  symbol?: string;
  placeholder?: string;
  error?: string;
}

export function AmountInput({
  label,
  tokenAddress,
  value,
  onChange,
  symbol,
  placeholder = "0.00",
  error,
}: AmountInputProps) {
  const { address } = useAccount();
  const { formatted } = useTokenBalance(tokenAddress, address);

  return (
    <div className="amount-input">
      <div className="amount-input__header">
        <label className="amount-input__label">{label}</label>
        {formatted && (
          <button
            className="amount-input__max"
            type="button"
            onClick={() => onChange(formatted)}
          >
            Balance: {formatted} {symbol}
          </button>
        )}
      </div>
      <div className={`amount-input__wrapper ${error ? "amount-input__wrapper--error" : ""}`}>
        <input
          className="amount-input__field"
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {symbol && <span className="amount-input__symbol">{symbol}</span>}
      </div>
      {error && <p className="amount-input__error">{error}</p>}
    </div>
  );
}
