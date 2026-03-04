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
          className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-[var(--border-default)] hover:border-[var(--border-active)] transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[13px] font-mono text-[var(--text-secondary)]">
            {shortAddr}
          </span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={`text-[var(--text-muted)] transition-transform duration-200 ${showMenu ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-40 backdrop-in" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-xl shadow-black/30 overflow-hidden z-50 slide-down">
              <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                <p className="text-[11px] text-[var(--text-muted)] mb-1">Connected Wallet</p>
                <p className="text-[12px] font-mono text-[var(--text-secondary)] truncate">{address}</p>
              </div>
              <button
                onClick={() => { disconnect(); setShowMenu(false); }}
                className="w-full px-4 py-3 text-left text-[13px] text-[var(--sell)] hover:bg-[var(--sell-muted)] transition-all duration-200 cursor-pointer hover:pl-5"
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
          className="px-5 py-2 text-[13px] font-semibold rounded-full bg-[var(--accent)] text-[#0a0a0a] hover:bg-[var(--accent-hover)] btn-lift cursor-pointer"
        >
          {connector.name}
        </button>
      ))}
    </div>
  );
}
