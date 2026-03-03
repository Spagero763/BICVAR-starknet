"use client";

import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { motion, AnimatePresence } from "framer-motion";
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
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all duration-200 group"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[13px] font-mono text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
            {shortAddr}
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-[var(--text-muted)] transition-transform duration-200 ${showMenu ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-2xl shadow-black/40 overflow-hidden z-50"
            >
              <div className="px-3 py-2.5 border-b border-[var(--border-subtle)]">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">Connected</p>
                <p className="text-[12px] font-mono text-[var(--text-secondary)] mt-0.5 truncate">{address}</p>
              </div>
              <button
                onClick={() => {
                  disconnect();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2.5 text-left text-[13px] text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Disconnect
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <motion.button
          key={connector.id}
          onClick={() => connect({ connector })}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 text-[13px] font-medium rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all duration-200"
        >
          {connector.name}
        </motion.button>
      ))}
    </div>
  );
}
