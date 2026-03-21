"use client";

type Status = "idle" | "approving" | "confirm" | "pending" | "success" | "error" | "permitting" | "swapping";

interface TxStatusProps {
  status: Status;
  txHash?: `0x${string}`;
  successMessage?: string;
  errorMessage?: string;
  onReset?: () => void;
}

export function TxStatus({ status, txHash, successMessage, errorMessage, onReset }: TxStatusProps) {
  if (status === "idle") return null;

  const explorerUrl = txHash
    ? `https://sepolia.etherscan.io/tx/${txHash}`
    : undefined;

  return (
    <div className={`tx-status tx-status--${status}`}>
      {(status === "approving" || status === "permitting") && (
        <>
          <span className="spinner" />
          <span>{status === "permitting" ? "Setting up Permit2 approval…" : "Approval transaction pending…"}</span>
        </>
      )}
      {(status === "confirm" || status === "swapping") && (
        <>
          <span className="spinner" />
          <span>{status === "swapping" ? "Confirm swap in your wallet…" : "Confirm in your wallet…"}</span>
        </>
      )}
      {status === "pending" && (
        <>
          <span className="spinner" />
          <span>Transaction submitted, waiting for confirmation…</span>
          {txHash && (
            <a href={explorerUrl} target="_blank" rel="noreferrer" className="tx-status__link">
              View on explorer ↗
            </a>
          )}
        </>
      )}
      {status === "success" && (
        <>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1"/>
            <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{successMessage ?? "Transaction confirmed"}</span>
          {txHash && (
            <a href={explorerUrl} target="_blank" rel="noreferrer" className="tx-status__link">
              View on explorer ↗
            </a>
          )}
          {onReset && (
            <button className="tx-status__reset" onClick={onReset}>Reset</button>
          )}
        </>
      )}
      {status === "error" && (
        <>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1"/>
            <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span>{errorMessage ?? "Transaction failed or rejected"}</span>
          {onReset && (
            <button className="tx-status__reset" onClick={onReset}>Try again</button>
          )}
        </>
      )}
    </div>
  );
}
