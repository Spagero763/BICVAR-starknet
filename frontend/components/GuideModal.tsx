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
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 border border-[var(--accent)]/20 bg-[var(--bg-card)] text-[var(--accent)] text-[10px] font-mono font-bold tracking-[0.15em] uppercase hover:border-[var(--accent)]/40 hover:bg-[var(--bg-elevated)] btn-terminal cursor-pointer terminal-in fade-in-delay-5"
      >
        <span className="w-1.5 h-1.5 bg-[var(--accent)] glow-pulse" />
        Guide
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 glass backdrop-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden border border-[var(--border-default)] bg-[var(--bg-card)] shadow-2xl shadow-black/60 modal-in">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-[var(--accent)]" />
                <p className="text-[10px] font-mono font-bold text-[var(--text-primary)] tracking-[0.15em] uppercase">Getting Started</p>
                <span className="text-[9px] font-mono text-[var(--text-muted)]">[{activeStep + 1}/{guideSteps.length}]</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 flex items-center justify-center hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-muted)] hover:text-[var(--sell)] cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step Navigation */}
            <div className="px-5 py-2 border-b border-[var(--border-subtle)] overflow-x-auto">
              <div className="flex gap-0.5">
                {guideSteps.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-mono font-bold tracking-wider transition-all shrink-0 cursor-pointer ${
                      i === activeStep
                        ? "bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/15"
                        : i < activeStep
                        ? "text-[var(--accent)]/40 border border-transparent"
                        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent"
                    }`}
                  >
                    <span className="font-mono">{String(s.step).padStart(2, '0')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="px-5 py-5 overflow-y-auto" style={{ maxHeight: "calc(85vh - 180px)" }}>
              {/* Step Header */}
              <div className="mb-4">
                <p className="text-[9px] font-mono text-[var(--accent)] tracking-[0.3em] uppercase mb-1 opacity-50">
                  // Step {String(current.step).padStart(2, '0')}
                </p>
                <h3 className="text-[18px] font-mono font-bold text-[var(--text-primary)] tracking-tight">
                  {current.title}
                </h3>
              </div>

              {/* Instructions */}
              <div className="space-y-2 mb-5">
                {current.body.map((instruction, i) => (
                  <div key={`${activeStep}-${i}`} className={`flex items-start gap-3 slide-in-right stagger-${i + 1}`}>
                    <span className="text-[9px] font-mono text-[var(--accent)] opacity-40 mt-0.5 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-[12px] font-mono text-[var(--text-secondary)] leading-relaxed">
                      {instruction}
                    </p>
                  </div>
                ))}
              </div>

              {/* Tip */}
              {current.tip && (
                <div className="border-l-2 border-[var(--accent)]/20 bg-[var(--accent-light)] px-4 py-3">
                  <p className="text-[10px] font-mono text-[var(--text-secondary)] leading-relaxed">
                    <span className="text-[var(--accent)] font-bold">TIP: </span>
                    {current.tip}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                disabled={activeStep === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Prev
              </button>

              <div className="flex items-center gap-1">
                {guideSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`transition-all duration-300 ${
                      i === activeStep
                        ? "bg-[var(--accent)] w-4 h-1"
                        : i < activeStep
                        ? "bg-[var(--accent)]/30 w-1 h-1"
                        : "bg-[var(--border-default)] w-1 h-1"
                    }`}
                  />
                ))}
              </div>

              {activeStep < guideSteps.length - 1 ? (
                <button
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold tracking-[0.1em] uppercase bg-[var(--accent)] text-[#000] hover:bg-[var(--accent-hover)] btn-terminal cursor-pointer"
                >
                  Next
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold tracking-[0.1em] uppercase bg-[var(--accent)] text-[#000] hover:bg-[var(--accent-hover)] btn-terminal cursor-pointer"
                >
                  Start Trading
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
