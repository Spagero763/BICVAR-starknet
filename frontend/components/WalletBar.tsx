"use client";

import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { useState } from "react";

const WALLET_INFO = {
  argentX: {
    name: "Argent X",
    color: "var(--accent)",
    colorLight: "var(--accent-light)",
    chrome: "https://chrome.google.com/webstore/detail/argent-x/dlcobpjiigpikoobohmabehhmhfoodbb",
    firefox: "https://addons.mozilla.org/en-US/firefox/addon/argent-x/",
    ios: "https://apps.apple.com/app/argent/id1358741926",
    android: "https://play.google.com/store/apps/details?id=im.argent.contractwalletclient",
    website: "https://www.argent.xyz/argent-x/",
  },
  braavos: {
    name: "Braavos",
    color: "var(--cyan)",
    colorLight: "var(--cyan-light)",
    chrome: "https://chrome.google.com/webstore/detail/braavos-smart-wallet/jnlgamecbpmbajjfhmmmlhejkemejdma",
    firefox: "https://addons.mozilla.org/en-US/firefox/addon/braavos-wallet/",
    ios: "https://apps.apple.com/app/braavos-smart-wallet/id1611883222",
    android: "https://play.google.com/store/apps/details?id=app.braavos",
    website: "https://braavos.app/",
  },
};

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function WalletNotFoundModal({ walletKey, onClose }: { walletKey: string | null; onClose: () => void }) {
  if (!walletKey) return null;

  const isMobile = isMobileDevice();
  const wallet = walletKey === "braavos" ? WALLET_INFO.braavos : WALLET_INFO.argentX;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ height: '100dvh' }}>
      <div className="absolute inset-0 bg-black/80 glass backdrop-in" onClick={onClose} />

      <div className="relative w-full max-w-sm border border-[var(--border-default)] bg-[var(--bg-card)] shadow-2xl shadow-black/60 modal-in overflow-y-auto" style={{ maxHeight: '80dvh' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--warning)]" />
            <p className="text-[10px] font-mono font-bold text-[var(--text-primary)] tracking-[0.15em] uppercase">Wallet Not Detected</p>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-muted)] hover:text-[var(--sell)] cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-3">
          <p className="text-[11px] font-mono text-[var(--text-secondary)] leading-relaxed">
            <span className="font-bold" style={{ color: wallet.color }}>{wallet.name}</span> wallet was not found{isMobile ? " on your device" : " in your browser"}. Install it to connect to BICVAR.
          </p>

          {isMobile ? (
            <>
              <p className="text-[9px] font-mono text-[var(--text-muted)] tracking-[0.2em] uppercase">// Download Mobile App</p>
              <div className="flex flex-col gap-2">
                <a
                  href={wallet.ios}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2.5 border border-[var(--border-subtle)] hover:border-current/20 bg-[var(--bg-primary)] transition-all group cursor-pointer"
                  style={{ "--hover-color": wallet.color } as React.CSSProperties}
                >
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    <span className="text-[11px] font-mono font-bold text-[var(--text-secondary)] tracking-wider group-hover:text-[var(--text-primary)] transition-colors">App Store</span>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
                <a
                  href={wallet.android}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2.5 border border-[var(--border-subtle)] hover:border-current/20 bg-[var(--bg-primary)] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                      <path d="M17.523 2.23l1.625 2.815a.5.5 0 01-.866.5l-1.658-2.872a8.48 8.48 0 00-3.137-1.022h-.974a8.48 8.48 0 00-3.137 1.022L7.718 5.545a.5.5 0 01-.866-.5L8.477 2.23A10.01 10.01 0 003 11h18a10.01 10.01 0 00-3.477-8.77zM7 9a1 1 0 110-2 1 1 0 010 2zm10 0a1 1 0 110-2 1 1 0 010 2zM3 12v6a3 3 0 003 3h12a3 3 0 003-3v-6H3z" />
                    </svg>
                    <span className="text-[11px] font-mono font-bold text-[var(--text-secondary)] tracking-wider group-hover:text-[var(--text-primary)] transition-colors">Google Play</span>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </>
          ) : (
            <>
              <p className="text-[9px] font-mono text-[var(--text-muted)] tracking-[0.2em] uppercase">// Install Browser Extension</p>
              <div className="flex flex-col gap-2">
                <a
                  href={wallet.chrome}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2.5 border border-[var(--border-subtle)] hover:border-current/20 bg-[var(--bg-primary)] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 opacity-60" />
                    <span className="text-[11px] font-mono font-bold text-[var(--text-secondary)] tracking-wider group-hover:text-[var(--text-primary)] transition-colors">Chrome Web Store</span>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
                <a
                  href={wallet.firefox}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2.5 border border-[var(--border-subtle)] hover:border-current/20 bg-[var(--bg-primary)] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 opacity-60" />
                    <span className="text-[11px] font-mono font-bold text-[var(--text-secondary)] tracking-wider group-hover:text-[var(--text-primary)] transition-colors">Firefox Add-ons</span>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </>
          )}

          {/* Alt platform links */}
          <div className="border-t border-[var(--border-subtle)] pt-3">
            <p className="text-[9px] font-mono text-[var(--text-muted)] tracking-wider leading-relaxed text-center">
              {isMobile
                ? "Using a desktop? Install the browser extension instead."
                : "On mobile? Download the wallet app from App Store or Google Play."}
            </p>
            <div className="flex gap-2 mt-2">
              {isMobile ? (
                <>
                  <a href={wallet.chrome} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center px-2 py-1.5 text-[9px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-all cursor-pointer tracking-wider uppercase">
                    Chrome
                  </a>
                  <a href={wallet.firefox} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center px-2 py-1.5 text-[9px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-all cursor-pointer tracking-wider uppercase">
                    Firefox
                  </a>
                </>
              ) : (
                <>
                  <a href={wallet.ios} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center px-2 py-1.5 text-[9px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-all cursor-pointer tracking-wider uppercase">
                    iOS App
                  </a>
                  <a href={wallet.android} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center px-2 py-1.5 text-[9px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-all cursor-pointer tracking-wider uppercase">
                    Android App
                  </a>
                </>
              )}
            </div>
          </div>

          {/* After install note */}
          <div className="border-l-2 border-[var(--accent)]/20 bg-[var(--accent-light)] px-3 py-2">
            <p className="text-[9px] font-mono text-[var(--text-secondary)] leading-relaxed">
              <span className="text-[var(--accent)] font-bold">AFTER INSTALL: </span>
              Refresh this page &rarr; Switch wallet to Sepolia testnet &rarr; Click Connect
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WalletBar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showMenu, setShowMenu] = useState(false);
  const [notFoundWallet, setNotFoundWallet] = useState<string | null>(null);

  const handleConnect = async (connector: (typeof connectors)[0]) => {
    try {
      const isAvailable = await connector.available();

      if (!isAvailable) {
        const key = connector.id.toLowerCase().includes("braavos") ? "braavos" : "argentX";
        setNotFoundWallet(key);
        return;
      }

      connect({ connector });
    } catch {
      const key = connector.id.toLowerCase().includes("braavos") ? "braavos" : "argentX";
      setNotFoundWallet(key);
    }
  };

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
    <>
      <div className="flex flex-col items-end gap-2">
        <div className="flex gap-2">
          {connectors.length > 0 ? (
            connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => handleConnect(connector)}
                className="px-4 sm:px-5 py-2 text-[10px] sm:text-[11px] font-mono font-bold tracking-[0.1em] uppercase bg-[var(--accent)] text-[#000] hover:bg-[var(--accent-hover)] btn-terminal cursor-pointer"
              >
                {connector.name}
              </button>
            ))
          ) : (
            <button
              onClick={() => setNotFoundWallet("argentX")}
              className="px-4 sm:px-5 py-2 text-[10px] sm:text-[11px] font-mono font-bold tracking-[0.1em] uppercase bg-[var(--accent)] text-[#000] hover:bg-[var(--accent-hover)] btn-terminal cursor-pointer"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      <WalletNotFoundModal
        walletKey={notFoundWallet}
        onClose={() => setNotFoundWallet(null)}
      />
    </>
  );
}
