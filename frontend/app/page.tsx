"use client";

import { WalletBar } from "@/components/WalletBar";
import { OrderForm } from "@/components/OrderForm";
import { OrderBook } from "@/components/OrderBook";
import { PoolBalances } from "@/components/PoolBalances";
import { GuideModal } from "@/components/GuideModal";
import { useAccount } from "@starknet-react/core";

const steps = [
  { num: "01", label: "Deposit", desc: "Fund your vault with BTC or USDC" },
  { num: "02", label: "Commit", desc: "Submit a private hash of your order" },
  { num: "03", label: "Reveal", desc: "Disclose when you're ready to trade" },
  { num: "04", label: "Settle", desc: "Matched at a fair midpoint price" },
];

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            <div className="flex items-center gap-3">
              <span className="text-[22px] font-bold tracking-tight text-[var(--text-primary)]">
                BICVAR
              </span>
              <span className="text-[11px] font-medium text-[var(--text-muted)] tracking-[0.2em] uppercase mt-1">
                Exchange
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-subtle)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[12px] text-[var(--text-muted)]">Sepolia Testnet</span>
              </div>
              <WalletBar />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Only when not connected */}
      {!isConnected && (
        <section className="max-w-[1200px] mx-auto px-6 lg:px-8 pt-24 pb-20">
          <div className="max-w-2xl">
            <p className="text-[var(--accent)] text-[13px] font-medium tracking-[0.15em] uppercase mb-6 fade-in">
              Private Trading Protocol
            </p>
            <h1 className="text-[42px] md:text-[56px] font-bold leading-[1.08] tracking-tight text-[var(--text-primary)] mb-6 fade-in fade-in-delay-1">
              Trade privately.
              <br />
              Settle fairly.
            </h1>
            <p className="text-[17px] leading-[1.7] text-[var(--text-secondary)] max-w-lg mb-10 fade-in fade-in-delay-2">
              A dark pool exchange on Starknet where your orders stay hidden 
              until you choose to reveal them. No front-running. No information leakage.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--border-subtle)] rounded-2xl overflow-hidden mt-16 fade-in fade-in-delay-3">
            {steps.map((step) => (
              <div key={step.num} className="bg-[var(--bg-card)] p-6 md:p-8">
                <span className="text-[var(--accent)] text-[12px] font-mono font-medium">
                  {step.num}
                </span>
                <h3 className="text-[var(--text-primary)] text-[16px] font-semibold mt-3 mb-2">
                  {step.label}
                </h3>
                <p className="text-[var(--text-muted)] text-[13px] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Process Bar - When connected */}
      {isConnected && (
        <div className="border-b border-[var(--border-subtle)]">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-4">
            <div className="flex items-center gap-6 overflow-x-auto">
              {steps.map((step, i) => (
                <div key={step.num} className="flex items-center gap-6 shrink-0">
                  {i > 0 && <div className="w-8 h-px bg-[var(--border-subtle)]" />}
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--accent)] text-[11px] font-mono">{step.num}</span>
                    <span className="text-[13px] text-[var(--text-secondary)]">{step.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            <OrderForm />
            <PoolBalances />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-8 xl:col-span-9">
            <OrderBook />
          </div>
        </div>
      </main>

      <GuideModal />

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] mt-20">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-semibold text-[var(--text-primary)]">BICVAR</span>
              <span className="text-[12px] text-[var(--text-muted)]">Private Dark Pool Exchange</span>
            </div>
            <div className="flex items-center gap-6 text-[12px] text-[var(--text-muted)]">
              <span>Starknet</span>
              <span>·</span>
              <span>Poseidon Hash</span>
              <span>·</span>
              <span>Commit-Reveal</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
