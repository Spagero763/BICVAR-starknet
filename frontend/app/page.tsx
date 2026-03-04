"use client";

import { WalletBar } from "@/components/WalletBar";
import { OrderForm } from "@/components/OrderForm";
import { OrderBook } from "@/components/OrderBook";
import { PoolBalances } from "@/components/PoolBalances";
import { GuideModal } from "@/components/GuideModal";
import { useAccount } from "@starknet-react/core";
import { useState, useEffect } from "react";

export default function Home() {
  const { isConnected } = useAccount();
  const [booted, setBooted] = useState(false);
  const [bootLines, setBootLines] = useState<string[]>([]);

  const bootSequence = [
    "// BICVAR PROTOCOL v1.0",
    "// INITIALIZING DARK POOL ENGINE...",
    "// CONNECTING TO STARKNET SEPOLIA",
    "// POSEIDON HASH MODULE: LOADED",
    "// COMMIT-REVEAL ENGINE: ACTIVE",
    "// STATUS: OPERATIONAL",
  ];

  useEffect(() => {
    if (booted) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < bootSequence.length) {
        setBootLines((prev) => [...prev, bootSequence[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setBooted(true), 400);
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-void)] relative">
      {/* Grid background */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-void)]/90 glass">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[56px] sm:h-[60px]">
            <div className="flex items-center gap-2 sm:gap-4 fade-in">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[var(--accent)] glow-pulse" />
                <span className="text-[13px] sm:text-[14px] font-mono font-bold tracking-[0.15em] text-[var(--text-primary)] uppercase">
                  BICVAR
                </span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-[var(--border-default)]" />
              <span className="hidden sm:inline text-[10px] font-mono text-[var(--text-muted)] tracking-[0.2em] uppercase">
                Dark Pool Protocol
              </span>
            </div>

            <div className="flex items-center gap-5 fade-in fade-in-delay-1">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-[var(--border-subtle)] bg-[var(--bg-card)]">
                <span className="w-1.5 h-1.5 bg-[var(--accent)] status-live" />
                <span className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider uppercase">Sepolia</span>
              </div>
              <WalletBar />
            </div>
          </div>
        </div>
      </nav>

      {/* Boot Sequence / Hero - Only when not connected */}
      {!isConnected && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-10 sm:pb-16">
          {!booted ? (
            <div className="max-w-2xl font-mono space-y-1">
              {bootLines.map((line, i) => (
                <p
                  key={i}
                  className={`text-[12px] terminal-in stagger-${Math.min(i + 1, 8)} ${
                    i === bootLines.length - 1
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {line}
                </p>
              ))}
              <span className="inline-block w-2 h-4 bg-[var(--accent)] mt-2" style={{ animation: "blink 1s step-end infinite" }} />
            </div>
          ) : (
            <div className="fade-in">
              {/* System header */}
              <div className="mb-8">
                <p className="text-[10px] font-mono text-[var(--text-muted)] tracking-[0.3em] uppercase mb-6 fade-in-up">
                  // PRIVATE TRADING PROTOCOL ON STARKNET
                </p>
                <h1 className="text-[28px] sm:text-[38px] md:text-[56px] lg:text-[68px] font-mono font-bold leading-[0.95] tracking-tight text-[var(--text-primary)] mb-2 fade-in-up fade-in-delay-1">
                  TRADE IN
                  <br />
                  <span className="text-[var(--accent)] text-glow">THE DARK</span>
                </h1>
                <div className="h-px w-32 bg-[var(--accent)] mt-6 mb-6 fade-in-up fade-in-delay-2" style={{ opacity: 0.3 }} />
                <p className="text-[13px] font-mono leading-[1.8] text-[var(--text-secondary)] max-w-lg fade-in-up fade-in-delay-2">
                  Orders are Poseidon-hashed on-chain — invisible until you reveal them.
                  <br />
                  No front-running. No information leakage. No trust required.
                </p>
              </div>

              {/* Protocol Steps — terminal style */}
              <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border-subtle)] fade-in-up fade-in-delay-3">
                {[
                  { id: "01", cmd: "DEPOSIT", desc: "Fund vault with BTC or USDC tokens" },
                  { id: "02", cmd: "COMMIT", desc: "Submit Poseidon hash of order params" },
                  { id: "03", cmd: "REVEAL", desc: "Disclose order when ready to trade" },
                  { id: "04", cmd: "SETTLE", desc: "Matched at fair midpoint price" },
                ].map((step, i) => (
                  <div
                    key={step.id}
                    className={`bg-[var(--bg-card)] p-6 group transition-all duration-500 hover:bg-[var(--bg-elevated)] corner-marks terminal-in stagger-${i + 4}`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-mono text-[var(--accent)] opacity-50">{step.id}</span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">//</span>
                    </div>
                    <h3 className="text-[14px] font-mono font-bold text-[var(--text-primary)] tracking-[0.1em] mb-2 transition-all duration-300 group-hover:text-[var(--accent)] group-hover:text-glow">
                      {step.cmd}
                    </h3>
                    <p className="text-[11px] font-mono text-[var(--text-muted)] leading-relaxed transition-colors duration-300 group-hover:text-[var(--text-secondary)]">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* System info bar */}
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-mono text-[var(--text-muted)] tracking-wider fade-in-up fade-in-delay-4">
                <span>NETWORK: STARKNET SEPOLIA</span>
                <span className="text-[var(--border-default)]">|</span>
                <span>HASH: POSEIDON</span>
                <span className="text-[var(--border-default)]">|</span>
                <span>ENGINE: COMMIT-REVEAL</span>
                <span className="text-[var(--border-default)]">|</span>
                <span className="text-[var(--accent)]">STATUS: LIVE</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* System Status Bar - When connected */}
      {isConnected && (
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/50 fade-in">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto text-[10px] font-mono text-[var(--text-muted)] tracking-wider uppercase">
              {[
                { id: "01", label: "Deposit" },
                { id: "02", label: "Commit" },
                { id: "03", label: "Reveal" },
                { id: "04", label: "Settle" },
              ].map((step, i) => (
                <div key={step.id} className={`flex items-center gap-4 shrink-0 terminal-in stagger-${i + 1}`}>
                  {i > 0 && <span className="text-[var(--border-default)]">—</span>}
                  <div className="flex items-center gap-2 group cursor-default">
                    <span className="text-[var(--accent)] opacity-40">{step.id}</span>
                    <span className="transition-colors duration-300 group-hover:text-[var(--text-secondary)]">{step.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-4">
            <div className="terminal-in fade-in-delay-1"><OrderForm /></div>
            <div className="terminal-in fade-in-delay-2"><PoolBalances /></div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-8 xl:col-span-9 terminal-in fade-in-delay-2">
            <OrderBook />
          </div>
        </div>
      </main>

      <GuideModal />

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] mt-8 sm:mt-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[var(--accent)] opacity-40" />
              <span className="text-[11px] font-mono font-bold text-[var(--text-secondary)] tracking-[0.1em] uppercase">BICVAR</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">// Private Dark Pool Protocol</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-[9px] sm:text-[10px] font-mono text-[var(--text-muted)] tracking-wider uppercase">
              <span className="transition-colors duration-300 hover:text-[var(--accent)] cursor-default">Starknet</span>
              <span className="opacity-20">|</span>
              <span className="transition-colors duration-300 hover:text-[var(--accent)] cursor-default">Poseidon</span>
              <span className="opacity-20">|</span>
              <span className="transition-colors duration-300 hover:text-[var(--accent)] cursor-default">Commit-Reveal</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
