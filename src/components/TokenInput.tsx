"use client";

import { useTokenInfo } from "@/hooks/useTokenInfo";

interface TokenInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}

export function TokenInput({ label, value, onChange, placeholder, error }: TokenInputProps) {
  const { symbol, name, isLoading, isValid } = useTokenInfo(value);

  const resolved = isValid && !isLoading && symbol;

  return (
    <div className="token-input">
      <label className="token-input__label">{label}</label>
      <div className={`token-input__wrapper ${error ? "token-input__wrapper--error" : ""} ${resolved ? "token-input__wrapper--valid" : ""}`}>
        <input
          className="token-input__field"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "0x…"}
          spellCheck={false}
        />
        {isLoading && isValid && (
          <span className="token-input__status token-input__status--loading">
            <span className="spinner" />
          </span>
        )}
        {resolved && (
          <span className="token-input__status token-input__status--resolved">
            <span className="token-input__symbol">{symbol}</span>
          </span>
        )}
        {isValid && !isLoading && !symbol && (
          <span className="token-input__status token-input__status--error">
            <span>?</span>
          </span>
        )}
      </div>
      {resolved && name && (
        <p className="token-input__name">{name}</p>
      )}
      {error && <p className="token-input__error">{error}</p>}
    </div>
  );
}
