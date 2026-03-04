"use client";

import { useState } from "react";

const guideSteps = [
  {
    step: 1,
    title: "Connect Your Wallet",
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
    title: "Commit an Order",
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
    body: [
      "In the Order Book, use the Match Orders section",
      "Select a revealed Buy Order and a revealed Sell Order",
      "Click \"Match Orders\"",
      "The trade executes at the midpoint price — fair for both sides",
    ],
    tip: "Both orders must be revealed. The buy price must be >= sell price.",
  },
  {
    step: 7,
    title: "Withdraw Funds",
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
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent)] text-[#0a0a0a] text-[13px] font-semibold shadow-lg hover:bg-[var(--accent-hover)] hover:scale-[1.03] transition-all duration-200 cursor-pointer"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
        Guide
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] shadow-2xl fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)]">
              <div>
                <h2 className="text-[17px] font-semibold text-[var(--text-primary)]">Getting Started</h2>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">Step {activeStep + 1} of {guideSteps.length}</p>
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

            {/* Step Navigation */}
            <div className="px-6 py-3 border-b border-[var(--border-subtle)] overflow-x-auto">
              <div className="flex gap-1">
                {guideSteps.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                      i === activeStep
                        ? "bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/20"
                        : i < activeStep
                        ? "bg-emerald-400/8 text-emerald-400/60 border border-emerald-400/10"
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
            <div className="px-6 py-6 overflow-y-auto" style={{ maxHeight: "calc(85vh - 210px)" }}>
              {/* Step Header */}
              <div className="mb-5">
                <p className="text-[11px] font-medium text-[var(--accent)] uppercase tracking-wider mb-1">
                  Step {current.step}
                </p>
                <h3 className="text-[20px] font-semibold text-[var(--text-primary)]">
                  {current.title}
                </h3>
              </div>

              {/* Instructions */}
              <div className="space-y-3 mb-6">
                {current.body.map((instruction, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
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
                <div className="rounded-xl bg-[var(--accent-light)] border border-[var(--accent)]/15 px-4 py-3 flex items-start gap-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[var(--accent)] mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                  <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                    <span className="font-semibold text-[var(--accent)]">Tip: </span>
                    {current.tip}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-subtle)]">
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

              <div className="flex items-center gap-1.5">
                {guideSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeStep
                        ? "bg-[var(--accent)] w-5"
                        : i < activeStep
                        ? "bg-emerald-400/40 w-1.5"
                        : "bg-[var(--border-default)] w-1.5"
                    }`}
                  />
                ))}
              </div>

              {activeStep < guideSteps.length - 1 ? (
                <button
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-medium bg-[var(--accent)] text-[#0a0a0a] hover:bg-[var(--accent-hover)] transition-all cursor-pointer"
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
          </div>
        </div>
      )}
    </>
  );
}
