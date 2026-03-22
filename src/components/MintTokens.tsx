"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { getChainAddresses, ERC20_ABI } from "@/lib/contracts";

type Step = "idle" | "confirm" | "pending" | "success" | "error";

export function MintTokens() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const addresses = getChainAddresses(chainId);

  const [amount, setAmount] = useState("10000");
  const [targetToken, setTargetToken] = useState<"token0" | "token1">("token0");
  const [step, setStep] = useState<Step>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { writeContractAsync } = useWriteContract();
  const { isSuccess: isMined } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isMined && step === "pending") setStep("success");
  }, [isMined, step]);

  const handleMint = async () => {
    if (!isConnected || !address || !amount) return;
    setStep("confirm");
    try {
      const tokenAddress = targetToken === "token0" ? addresses.TOKEN_ZERO : addresses.TOKEN_ONE;
      // We assume both tokens have 18 decimals for this standard ERC20 setup
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "mint",
        args: [address, parseUnits(amount, 18)],
      });
      setTxHash(hash);
      setStep("pending");
    } catch (e) {
      console.error(e);
      setStep("error");
    }
  };

  const reset = () => {
    setStep("idle");
    setTxHash(undefined);
  };

  if (step === "success") {
    return (
      <div className="create-pool__success">
        <div className="create-pool__success-icon">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="19" stroke="var(--accent)" strokeWidth="1.5" />
            <path d="M12 20l6 6 10-12" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="create-pool__success-title">Tokens Minted</h2>
        <p className="create-pool__success-sub">
          Successfully minted test tokens to your wallet.
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
        </div>
        <button className="btn btn--ghost" onClick={reset}>
          Mint more tokens
        </button>
      </div>
    );
  }

  return (
    <div className="create-pool">
      <div className="create-pool__section">
        <h3 className="create-pool__section-title">Select Token</h3>
        <div className="create-pool__chips" style={{ marginBottom: "1rem" }}>
          <button
            className={`chip ${targetToken === "token0" ? "chip--active" : ""}`}
            onClick={() => setTargetToken("token0")}
            type="button"
          >
            Token 0 ({addresses.TOKEN_ZERO.slice(0, 6)}…)
          </button>
          <button
            className={`chip ${targetToken === "token1" ? "chip--active" : ""}`}
            onClick={() => setTargetToken("token1")}
            type="button"
          >
            Token 1 ({addresses.TOKEN_ONE.slice(0, 6)}…)
          </button>
        </div>
      </div>

      <div className="create-pool__section">
        <h3 className="create-pool__section-title">Amount</h3>
        <div className="create-pool__custom-price">
          <input
            className="create-pool__price-input"
            type="number"
            min="0"
            step="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 10000"
          />
        </div>
      </div>

      <button
        className={`btn btn--primary create-pool__submit ${step === "confirm" || step === "pending" ? "btn--loading" : ""}`}
        onClick={handleMint}
        disabled={!isConnected || step === "confirm" || step === "pending" || !amount}
        type="button"
      >
        {!isConnected
          ? "Connect wallet to continue"
          : step === "confirm"
          ? "Confirm in wallet…"
          : step === "pending"
          ? "Minting…"
          : "Mint Tokens"}
      </button>

      {step === "error" && (
        <p className="create-pool__error create-pool__error--tx">
          Transaction failed or was rejected. Check your wallet and try again.
        </p>
      )}
    </div>
  );
}
