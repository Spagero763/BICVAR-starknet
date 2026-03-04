"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const guideSteps = [
  {
    step: 1,
    title: "Connect Your Wallet",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="M16 14h.01" />
        <path d="M2 10h20" />
      </svg>
    ),
    body: [
      "Install Argent X or Braavos browser extension",
      "Switch your wallet to Starknet Sepolia (testnet)",
      "Click \"Connect Wallet\" in the top-right corner",
      "Approve the connection in your wallet popup",
    ],
    tip: "Don't have Sepolia ETH for gas? Use a Starknet faucet to get free testnet ETH.",
  },
  {
    step: 2,
    title: "Mint Test Tokens",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v12" />
        <path d="M6 12h12" />
      </svg>
    ),
    body: [
      "Go to the Vault panel on the left side",
      "Click \"Mint BTC\" or \"Mint USDC\" to get free test tokens",
      "Approve the mint transaction in your wallet",
      "Wait a few seconds for the transaction to confirm",
    ],
    tip: "These are mock tokens for testing — they have no real value.",
  },
  {
    step: 3,
    title: "Deposit into the Pool",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14" />
        <path d="M19 12l-7 7-7-7" />
        <rect x="3" y="19" width="18" height="2" rx="1" />
      </svg>
    ),
    body: [
      "In the Vault panel, enter the amount you want to deposit",
      "Click the \"Deposit\" button next to BTC or USDC",
      "Approve the transaction — tokens move into the dark pool contract",
      "Your Pool Balance will update once the transaction confirms",
    ],
    tip: "You need pool balance before you can commit orders.",
  },
  {
    step: 4,
    title: "Commit an Order (Private)",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
    body: [
      "Go to the Order Form panel",
      "Choose Buy or Sell, then enter Price and Amount",
      "Click \"Submit Order\"",
      "The app Poseidon-hashes your order and submits only the hash on-chain",
      "Nobody can see your price, amount, or direction — just a random hash",
    ],
    tip: "Your order details are saved in your browser for the reveal step. Don't clear your browser data!",
  },
  {
    step: 5,
    title: "Reveal Your Order",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    body: [
      "Go to the Order Book panel on the right",
      "Find your committed order and click \"Reveal\"",
      "The contract verifies the hash matches your original parameters",
      "If valid, your order becomes visible and funds are locked as escrow",
    ],
    tip: "Only reveal when you're ready for your order to be matched.",
  },
  {
    step: 6,
    title: "Match Orders",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v3a2 2 0 01-2 2H3" />
        <path d="M21 8h-3a2 2 0 01-2-2V3" />
        <path d="M3 16h3a2 2 0 012 2v3" />
        <path d="M16 21v-3a2 2 0 012-2h3" />
      </svg>
    ),
    body: [
      "Scroll to the \"Match Orders\" section at the bottom of the Order Book",
      "Select a revealed Buy Order and a revealed Sell Order from the dropdowns",
      "Click \"Match Orders\"",
      "The trade executes at the midpoint price — fair for both sides",
    ],
    tip: "Both orders must be revealed. The buy price must be ≥ sell price.",
  },
  {
    step: 7,
    title: "Withdraw Funds",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
        <rect x="3" y="19" width="18" height="2" rx="1" />
      </svg>
    ),
    body: [
      "Go back to the Vault panel",
      "Enter the amount you want to withdraw",
      "Click \"Withdraw\" to move tokens back to your wallet",
      "Your wallet balance will update after confirmation",
    ],
    tip: "You can only withdraw funds that aren't locked in active orders.",
  },
];

export function GuideModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const current = guideSteps[activeStep];

  return (
    <>
      {/* Floating Guide Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-violet-600 text-white text-[13px] font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-200 cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
        How to Use
      </button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Getting Started Guide</h2>
                    <p className="text-[11px] text-[var(--text-muted)]">Step {activeStep + 1} of {guideSteps.length}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Step Navigation (horizontal pills) */}
              <div className="px-6 py-3 border-b border-[var(--border-subtle)] overflow-x-auto">
                <div className="flex gap-1.5">
                  {guideSteps.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveStep(i)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                        i === activeStep
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          : i < activeStep
                          ? "bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/20"
                          : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-card)] border border-transparent"
                      }`}
                    >
                      <span className="font-mono text-[10px]">{s.step}</span>
                      <span className="hidden sm:inline">{s.title.split(" ").slice(0, 2).join(" ")}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: "calc(85vh - 210px)" }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Step Header */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] flex items-center justify-center text-blue-400">
                        {current.icon}
                      </div>
                      <div>
                        <div className="text-[10px] font-mono font-bold text-blue-400/60 uppercase tracking-wider">
                          Step {current.step}
                        </div>
                        <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">
                          {current.title}
                        </h3>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-3 mb-5">
                      {current.body.map((instruction, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="mt-0.5 w-5 h-5 rounded-full bg-[var(--bg-card)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-mono font-bold text-[var(--text-muted)]">
                              {i + 1}
                            </span>
                          </div>
                          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                            {instruction}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Tip Box */}
                    {current.tip && (
                      <div className="rounded-xl bg-blue-500/5 border border-blue-500/15 px-4 py-3 flex items-start gap-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-blue-400 mt-0.5 shrink-0">
                          <path d="M9 18V5l12-2v13" />
                          <circle cx="6" cy="18" r="3" />
                          <circle cx="18" cy="16" r="3" />
                        </svg>
                        <p className="text-[12px] text-blue-300/80 leading-relaxed">
                          <span className="font-semibold text-blue-400">Tip: </span>
                          {current.tip}
                        </p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer Navigation */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/50">
                <button
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {guideSteps.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i === activeStep
                          ? "bg-blue-400 w-4"
                          : i < activeStep
                          ? "bg-emerald-400/50"
                          : "bg-[var(--border-default)]"
                      }`}
                    />
                  ))}
                </div>

                {activeStep < guideSteps.length - 1 ? (
                  <button
                    onClick={() => setActiveStep(activeStep + 1)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-all cursor-pointer"
                  >
                    Next
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all cursor-pointer"
                  >
                    Start Trading
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
