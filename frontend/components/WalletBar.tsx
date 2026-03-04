"use client";

import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { useState } from "react";

export function WalletBar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showMenu, setShowMenu] = useState(false);

  if (isConnected && address) {
    const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-3 px-4 py-2 border border-[var(--border-subtle)] hover:border-[var(--accent)]/20 bg-[var(--bg-card)] transition-all cursor-pointer group"
        >
          <span className="w-1.5 h-1.5 bg-[var(--accent)] glow-pulse" />
          <span className="text-[11px] font-mono text-[var(--text-secondary)] tracking-wider">
            {shortAddr}
          </span>
          <svg
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className={`text-[var(--text-muted)] transition-transform duration-200 ${showMenu ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-40 backdrop-in" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-1 w-56 bg-[var(--bg-card)] border border-[var(--border-default)] shadow-2xl shadow-black/50 overflow-hidden z-50 slide-down">
              <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                <p className="text-[9px] font-mono text-[var(--text-muted)] tracking-[0.2em] uppercase mb-1">// Connected</p>
                <p className="text-[10px] font-mono text-[var(--text-secondary)] truncate">{address}</p>
              </div>
              <button
                onClick={() => { disconnect(); setShowMenu(false); }}
                className="w-full px-4 py-3 text-left text-[11px] font-mono text-[var(--sell)] hover:bg-[var(--sell-muted)] transition-all duration-200 cursor-pointer tracking-wider uppercase"
              >
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          className="px-5 py-2 text-[11px] font-mono font-bold tracking-[0.1em] uppercase bg-[var(--accent)] text-[#000] hover:bg-[var(--accent-hover)] btn-terminal cursor-pointer"
        >
          {connector.name}
        </button>
      ))}
    </div>
  );
}
