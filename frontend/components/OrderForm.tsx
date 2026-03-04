"use client";

import { useState } from "react";
import { useAccount, useSendTransaction } from "@starknet-react/core";
import { hash, cairo, CallData } from "starknet";
import {
  DARKPOOL_ADDRESS,
  BTC_TOKEN_ADDRESS,
  USDC_TOKEN_ADDRESS,
  SIDE_BUY,
  SIDE_SELL,
} from "@/lib/contracts";

function parseAmount(value: string, decimals = 18): bigint {
  const [whole, frac = ""] = value.split(".");
  const fracPadded = frac.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole + fracPadded);
}

export function OrderForm() {
  const { address, isConnected } = useAccount();
  const [side, setSide] = useState<number>(SIDE_BUY);
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);

  const { sendAsync } = useSendTransaction({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !price || !amount) return;

    setIsSubmitting(true);
    setTxSuccess(false);
    setStatus("Hashing order parameters...");

    try {
      const priceU256 = BigInt(Math.floor(parseFloat(price)));
      const amountU256 = parseAmount(amount);

      const nonceBytes = new Uint8Array(31);
      crypto.getRandomValues(nonceBytes);
      const nonce = "0x" + Array.from(nonceBytes).map(b => b.toString(16).padStart(2, "0")).join("");

      const orderHash = hash.computePoseidonHashOnElements([
        BTC_TOKEN_ADDRESS,
        USDC_TOKEN_ADDRESS,
        side,
        cairo.uint256(priceU256).low,
        cairo.uint256(priceU256).high,
        cairo.uint256(amountU256).low,
        cairo.uint256(amountU256).high,
        nonce,
      ]);

      const orderKey = `bicvar_order_${Date.now()}`;
      localStorage.setItem(orderKey, JSON.stringify({
        side,
        price: priceU256.toString(),
        amount: amountU256.toString(),
        nonce,
        hash: orderHash,
        baseToken: BTC_TOKEN_ADDRESS,
        quoteToken: USDC_TOKEN_ADDRESS,
        timestamp: Date.now(),
      }));

      setStatus("Broadcasting commitment...");

      const result = await sendAsync([
        {
          contractAddress: DARKPOOL_ADDRESS,
          entrypoint: "commit_order",
          calldata: CallData.compile({ order_hash: orderHash }),
        },
      ]);

      localStorage.setItem(`${orderKey}_tx`, result.transaction_hash);
      setTxSuccess(true);
      setStatus(`${result.transaction_hash.slice(0, 14)}...`);
      setPrice("");
      setAmount("");
    } catch (err: unknown) {
      setTxSuccess(false);
      setStatus(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = price && amount ? (parseFloat(price) * parseFloat(amount)).toFixed(2) : null;

  if (!isConnected) {
    return (
      <div className="card p-6 sm:p-8 flex flex-col items-center justify-center min-h-[240px] gap-4">
        <div className="w-10 h-10 border border-[var(--border-default)] flex items-center justify-center float">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)]">
            <rect x="3" y="11" width="18" height="11" rx="1" ry="1" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-[12px] font-mono font-bold text-[var(--text-primary)] tracking-[0.1em] uppercase mb-1">Connect Wallet</p>
          <p className="text-[10px] font-mono text-[var(--text-muted)] mb-4">Starknet Sepolia Testnet</p>
        </div>

        {/* Wallet Download Links */}
        <div className="w-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 space-y-3">
          <p className="text-[9px] font-mono text-[var(--text-muted)] tracking-[0.2em] uppercase text-center">// Get a Starknet Wallet</p>
          <div className="flex flex-col gap-2">
            <a
              href="https://www.argent.xyz/argent-x/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 border border-[var(--border-subtle)] hover:border-[var(--accent)]/20 bg-[var(--bg-card)] transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[var(--accent)] opacity-60" />
                <span className="text-[11px] font-mono font-bold text-[var(--text-secondary)] tracking-wider group-hover:text-[var(--accent)] transition-colors">Argent X</span>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
            <a
              href="https://braavos.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 border border-[var(--border-subtle)] hover:border-[var(--cyan)]/20 bg-[var(--bg-card)] transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[var(--cyan)] opacity-60" />
                <span className="text-[11px] font-mono font-bold text-[var(--text-secondary)] tracking-wider group-hover:text-[var(--cyan)] transition-colors">Braavos</span>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)] group-hover:text-[var(--cyan)] transition-colors">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
          <p className="text-[9px] font-mono text-[var(--text-muted)] text-center leading-relaxed">
            Install extension &rarr; Create account &rarr; Switch to Sepolia
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[var(--border-subtle)]">
        <p className="text-[9px] font-mono text-[var(--text-muted)] tracking-[0.2em] uppercase">// Order Terminal</p>
      </div>

      {/* Side Toggle */}
      <div className="flex border-b border-[var(--border-subtle)]">
        {[
          { s: SIDE_BUY, label: "BUY" },
          { s: SIDE_SELL, label: "SELL" },
        ].map(({ s, label }) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`flex-1 py-3 text-[11px] font-mono font-bold tracking-[0.15em] transition-all duration-300 relative cursor-pointer ${
              side === s
                ? s === SIDE_BUY
                  ? "text-[var(--accent)] bg-[var(--buy-muted)]"
                  : "text-[var(--sell)] bg-[var(--sell-muted)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {label}
            {side === s && (
              <div className={`absolute bottom-0 left-0 right-0 h-px tab-underline ${
                s === SIDE_BUY ? "bg-[var(--accent)]" : "bg-[var(--sell)]"
              }`} />
            )}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Price */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider uppercase">Price</label>
            <span className="text-[9px] font-mono text-[var(--text-muted)]">USDC/BTC</span>
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full input-field px-4 py-3 text-[13px] font-mono"
          />
        </div>

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider uppercase">Amount</label>
            <span className="text-[9px] font-mono text-[var(--text-muted)]">BTC</span>
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full input-field px-4 py-3 text-[13px] font-mono"
          />
        </div>

        {/* Summary */}
        {total && (
          <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-3 space-y-2">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--text-muted)]">Total</span>
              <span className="text-[var(--text-primary)]">{total} USDC</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--text-muted)]">Privacy</span>
              <span className="text-[var(--accent)]">Poseidon Hash</span>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !price || !amount}
          className={`w-full py-3 text-[11px] font-mono font-bold tracking-[0.15em] uppercase btn-terminal cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
            side === SIDE_BUY
              ? "bg-[var(--accent)] text-[#000] hover:bg-[var(--accent-hover)]"
              : "bg-[var(--sell)] text-white hover:brightness-110"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round" />
              </svg>
              Committing...
            </span>
          ) : (
            `Commit ${side === SIDE_BUY ? "Buy" : "Sell"} Order`
          )}
        </button>
      </form>

      {/* Status */}
      {status && (
        <div className={`mx-5 mb-5 px-4 py-3 text-[11px] font-mono break-all border-l-2 slide-in-right ${
          txSuccess
            ? "border-[var(--accent)] bg-[var(--buy-muted)] text-[var(--accent)]"
            : isSubmitting
            ? "border-[var(--cyan)] bg-[var(--cyan-light)] text-[var(--cyan)]"
            : "border-[var(--sell)] bg-[var(--sell-muted)] text-[var(--sell)]"
        }`}>
          {txSuccess && <span className="text-[9px] block mb-1 opacity-50 tracking-wider uppercase">// TX Hash</span>}
          {status}
        </div>
      )}
    </div>
  );
}
