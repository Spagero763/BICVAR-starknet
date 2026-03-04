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
      <div className="card p-10 flex flex-col items-center justify-center min-h-[280px] gap-5">
        <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)]">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-[15px] font-medium text-[var(--text-primary)] mb-1">Connect Your Wallet</p>
          <p className="text-[13px] text-[var(--text-muted)]">Argent X or Braavos on Starknet Sepolia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Side Toggle */}
      <div className="flex border-b border-[var(--border-subtle)]">
        {[
          { s: SIDE_BUY, label: "Buy" },
          { s: SIDE_SELL, label: "Sell" },
        ].map(({ s, label }) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`flex-1 py-4 text-[14px] font-semibold transition-all relative cursor-pointer ${
              side === s
                ? s === SIDE_BUY
                  ? "text-emerald-400 bg-[var(--buy-muted)]"
                  : "text-red-400 bg-[var(--sell-muted)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {label}
            {side === s && (
              <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                s === SIDE_BUY ? "bg-emerald-400" : "bg-red-400"
              }`} />
            )}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Price */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[13px] font-medium text-[var(--text-secondary)]">Price</label>
            <span className="text-[12px] text-[var(--text-muted)]">USDC / BTC</span>
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full input-field rounded-xl px-4 py-3.5 text-[15px] font-mono"
          />
        </div>

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[13px] font-medium text-[var(--text-secondary)]">Amount</label>
            <span className="text-[12px] text-[var(--text-muted)]">BTC</span>
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full input-field rounded-xl px-4 py-3.5 text-[15px] font-mono"
          />
        </div>

        {/* Total Summary */}
        {total && (
          <div className="rounded-xl bg-[var(--bg-primary)] p-4 space-y-2.5 border border-[var(--border-subtle)]">
            <div className="flex justify-between text-[13px]">
              <span className="text-[var(--text-muted)]">Total</span>
              <span className="font-mono text-[var(--text-primary)]">{total} USDC</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[var(--text-muted)]">Privacy</span>
              <span className="text-[var(--accent)]">Poseidon Hash</span>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !price || !amount}
          className={`w-full py-4 rounded-xl text-[14px] font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
            side === SIDE_BUY
              ? "bg-emerald-500 hover:bg-emerald-400 text-white"
              : "bg-red-500 hover:bg-red-400 text-white"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
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
        <div className={`mx-6 mb-6 px-4 py-3 rounded-xl text-[13px] font-mono break-all border ${
          txSuccess
            ? "bg-emerald-400/5 border-emerald-400/15 text-emerald-400"
            : isSubmitting
            ? "bg-[var(--accent-light)] border-[var(--accent)]/15 text-[var(--accent)]"
            : "bg-red-400/5 border-red-400/15 text-red-400"
        }`}>
          {txSuccess && <span className="text-[11px] block mb-1 opacity-60">Transaction Hash</span>}
          {status}
        </div>
      )}
    </div>
  );
}
