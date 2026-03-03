"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
      <div className="card rounded-2xl p-8 flex flex-col items-center justify-center min-h-[280px] gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)]">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-[14px] font-medium text-[var(--text-secondary)]">Connect wallet to trade</p>
          <p className="text-[12px] text-[var(--text-muted)] mt-1">Argent X or Braavos on Starknet Sepolia</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card rounded-2xl overflow-hidden ${side === SIDE_BUY ? "glow-buy" : "glow-sell"}`}>
      <div className="flex border-b border-[var(--border-subtle)]">
        {[
          { s: SIDE_BUY, label: "Buy", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { s: SIDE_SELL, label: "Sell", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
        ].map(({ s, label, color, bg, border }) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`flex-1 py-3.5 text-[13px] font-semibold tracking-wide transition-all duration-200 relative ${
              side === s ? `${color} ${bg}` : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {label}
            {side === s && (
              <motion.div
                layoutId="side-indicator"
                className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                  s === SIDE_BUY ? "bg-emerald-400" : "bg-red-400"
                }`}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] uppercase tracking-wider font-medium text-[var(--text-muted)]">Price</label>
            <span className="text-[11px] text-[var(--text-muted)]">USDC / BTC</span>
          </div>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-default)] rounded-xl px-4 py-3 text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/40 focus:outline-none font-mono transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] uppercase tracking-wider font-medium text-[var(--text-muted)]">Amount</label>
            <span className="text-[11px] text-[var(--text-muted)]">BTC</span>
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-default)] rounded-xl px-4 py-3 text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/40 focus:outline-none font-mono transition-colors"
          />
        </div>

        <AnimatePresence>
          {total && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-[var(--bg-elevated)]/60 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--text-muted)]">Total</span>
                  <span className="font-mono text-[var(--text-primary)]">{total} USDC</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--text-muted)]">Privacy</span>
                  <span className="text-blue-400 flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Poseidon Hash
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={isSubmitting || !price || !amount}
          whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          className={`w-full py-3.5 rounded-xl text-[14px] font-semibold transition-all duration-200 disabled:cursor-not-allowed ${
            side === SIDE_BUY
              ? "bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-emerald-800/50 disabled:to-emerald-900/50 text-white disabled:text-emerald-300/30 shadow-lg shadow-emerald-500/15"
              : "bg-gradient-to-b from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 disabled:from-red-800/50 disabled:to-red-900/50 text-white disabled:text-red-300/30 shadow-lg shadow-red-500/15"
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
        </motion.button>
      </form>

      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`mx-5 mb-5 px-3 py-2.5 rounded-lg text-[12px] font-mono break-all ${
              txSuccess
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : isSubmitting
                ? "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}>
              {txSuccess && <span className="text-[10px] uppercase tracking-wider block mb-0.5 opacity-60">tx hash</span>}
              {status}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
