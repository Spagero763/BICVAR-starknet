"use client";

import { motion } from "framer-motion";
import { WalletBar } from "@/components/WalletBar";
import { OrderForm } from "@/components/OrderForm";
import { OrderBook } from "@/components/OrderBook";
import { PoolBalances } from "@/components/PoolBalances";
import { useAccount } from "@starknet-react/core";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const steps = [
  { num: "01", label: "Deposit", desc: "Fund your vault" },
  { num: "02", label: "Commit", desc: "Hash your intent" },
  { num: "03", label: "Reveal", desc: "Unlock when ready" },
  { num: "04", label: "Settle", desc: "Atomic execution" },
];

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen mesh-gradient dot-grid relative">
      <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[17px] font-semibold tracking-tight text-[var(--text-primary)]">
                BICVAR
              </span>
              <span className="text-[11px] font-medium text-[var(--text-muted)] tracking-widest uppercase">
                Exchange
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium text-[var(--text-muted)]">Sepolia</span>
            </div>
            <WalletBar />
          </div>
        </div>
      </header>

      <div className="border-b border-[var(--border-subtle)]">
        <div className="max-w-[1440px] mx-auto px-6 py-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            {steps.map((step, i) => (
              <div key={step.num} className="flex items-center gap-1">
                {i > 0 && (
                  <div className="w-8 h-px bg-gradient-to-r from-[var(--border-default)] to-transparent mx-1" />
                )}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-card)] transition-colors shrink-0 group cursor-default">
                  <span className="text-[10px] font-mono font-bold text-blue-400/60 group-hover:text-blue-400 transition-colors">
                    {step.num}
                  </span>
                  <span className="text-[12px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                    {step.label}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] hidden md:inline">
                    {step.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!isConnected && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-[1440px] mx-auto px-6 pt-20 pb-16 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
              Private BTC trading.
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
                Commit. Reveal. Settle.
              </span>
            </h2>
            <p className="mt-5 text-[15px] text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed">
              Dark pool exchange on Starknet. Orders are Poseidon-hashed
              on-chain — invisible until you reveal and match.
            </p>
          </motion.div>
        </motion.section>
      )}

      <main className="max-w-[1440px] mx-auto px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <motion.div
            className="lg:col-span-4 xl:col-span-3 space-y-5"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.div variants={fadeUp} custom={0}>
              <OrderForm />
            </motion.div>
            <motion.div variants={fadeUp} custom={1}>
              <PoolBalances />
            </motion.div>
          </motion.div>

          <motion.div
            className="lg:col-span-8 xl:col-span-9"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <OrderBook />
          </motion.div>
        </div>
      </main>

      <footer className="mt-auto border-t border-[var(--border-subtle)]">
        <div className="max-w-[1440px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-[var(--text-muted)]">BICVAR</span>
            <span className="text-[10px] text-[var(--text-muted)]">·</span>
            <span className="text-[11px] text-[var(--text-muted)]">RE{"{DEFINE}"} Hackathon 2026</span>
          </div>
          <div className="flex items-center gap-5 text-[11px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-blue-400/50" />
              Starknet
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-violet-400/50" />
              Poseidon Hash
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-400/50" />
              Commit-Reveal
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
