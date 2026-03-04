"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useSendTransaction } from "@starknet-react/core";
import { Contract, RpcProvider, CallData } from "starknet";
import {
  DARKPOOL_ADDRESS,
  BTC_TOKEN_ADDRESS,
  USDC_TOKEN_ADDRESS,
  DARKPOOL_ABI,
  ERC20_ABI,
} from "@/lib/contracts";

function formatAmount(raw: bigint | string, decimals = 18): string {
  const bn = typeof raw === "string" ? BigInt(raw) : raw;
  const whole = bn / BigInt(10 ** decimals);
  const frac = bn % BigInt(10 ** decimals);
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, 4).replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

export function PoolBalances() {
  const { address, isConnected } = useAccount();
  const [btcBalance, setBtcBalance] = useState<bigint>(0n);
  const [usdcBalance, setUsdcBalance] = useState<bigint>(0n);
  const [btcWallet, setBtcWallet] = useState<bigint>(0n);
  const [usdcWallet, setUsdcWallet] = useState<bigint>(0n);
  const [activeToken, setActiveToken] = useState<"BTC" | "USDC">("BTC");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");

  const { sendAsync } = useSendTransaction({});

  const loadBalances = useCallback(async () => {
    if (!isConnected || !address || DARKPOOL_ADDRESS === "0x0") return;

    try {
      const provider = new RpcProvider({
        nodeUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://api.cartridge.gg/x/starknet/sepolia",
      });

      const darkpool = new Contract({ abi: DARKPOOL_ABI as any, address: DARKPOOL_ADDRESS, providerOrAccount: provider });

      const btcBal = await darkpool.get_balance(address, BTC_TOKEN_ADDRESS);
      const usdcBal = await darkpool.get_balance(address, USDC_TOKEN_ADDRESS);
      setBtcBalance(BigInt(btcBal.toString()));
      setUsdcBalance(BigInt(usdcBal.toString()));

      if (BTC_TOKEN_ADDRESS !== "0x0") {
        const btcToken = new Contract({ abi: ERC20_ABI as any, address: BTC_TOKEN_ADDRESS, providerOrAccount: provider });
        const walletBtc = await btcToken.balance_of(address);
        setBtcWallet(BigInt(walletBtc.toString()));
      }
      if (USDC_TOKEN_ADDRESS !== "0x0") {
        const usdcToken = new Contract({ abi: ERC20_ABI as any, address: USDC_TOKEN_ADDRESS, providerOrAccount: provider });
        const walletUsdc = await usdcToken.balance_of(address);
        setUsdcWallet(BigInt(walletUsdc.toString()));
      }
    } catch (err) {
      console.error("Failed to load balances:", err);
    }
  }, [isConnected, address]);

  useEffect(() => {
    loadBalances();
    const interval = setInterval(loadBalances, 15000);
    return () => clearInterval(interval);
  }, [loadBalances]);

  const tokenAddress = activeToken === "BTC" ? BTC_TOKEN_ADDRESS : USDC_TOKEN_ADDRESS;

  const parseAmount = (value: string, decimals = 18): bigint => {
    const [whole, frac = ""] = value.split(".");
    const fracPadded = frac.padEnd(decimals, "0").slice(0, decimals);
    return BigInt(whole + fracPadded);
  };

  const handleDeposit = async () => {
    if (!depositAmount || !address) return;
    setIsDepositing(true);
    try {
      const amount = parseAmount(depositAmount);
      await sendAsync([
        {
          contractAddress: tokenAddress,
          entrypoint: "approve",
          calldata: CallData.compile({
            spender: DARKPOOL_ADDRESS,
            amount: { low: amount & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), high: amount >> 128n },
          }),
        },
        {
          contractAddress: DARKPOOL_ADDRESS,
          entrypoint: "deposit",
          calldata: CallData.compile({
            token: tokenAddress,
            amount: { low: amount & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), high: amount >> 128n },
          }),
        },
      ]);
      setDepositAmount("");
      await loadBalances();
    } catch (err) {
      console.error("Deposit failed:", err);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !address) return;
    setIsWithdrawing(true);
    try {
      const amount = parseAmount(withdrawAmount);
      await sendAsync([
        {
          contractAddress: DARKPOOL_ADDRESS,
          entrypoint: "withdraw",
          calldata: CallData.compile({
            token: tokenAddress,
            amount: { low: amount & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), high: amount >> 128n },
          }),
        },
      ]);
      setWithdrawAmount("");
      await loadBalances();
    } catch (err) {
      console.error("Withdraw failed:", err);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleMintTestTokens = async () => {
    if (!address) return;
    setIsMinting(true);
    try {
      const mintAmount = parseAmount("1000");
      await sendAsync([
        {
          contractAddress: BTC_TOKEN_ADDRESS,
          entrypoint: "mint",
          calldata: CallData.compile({
            recipient: address,
            amount: { low: mintAmount & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), high: mintAmount >> 128n },
          }),
        },
        {
          contractAddress: USDC_TOKEN_ADDRESS,
          entrypoint: "mint",
          calldata: CallData.compile({
            recipient: address,
            amount: { low: mintAmount & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), high: mintAmount >> 128n },
          }),
        },
      ]);
      await loadBalances();
    } catch (err) {
      console.error("Mint failed:", err);
    } finally {
      setIsMinting(false);
    }
  };

  if (!isConnected) return null;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)]">
        <p className="text-[9px] font-mono text-[var(--text-muted)] tracking-[0.2em] uppercase">// Vault</p>
        <button
          onClick={loadBalances}
          className="text-[9px] font-mono text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer tracking-wider uppercase"
        >
          Refresh
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Balance readout */}
        <div className="space-y-2">
          <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-3 group transition-all duration-300 hover:border-orange-500/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-500 opacity-60" />
                <span className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider uppercase">BTC</span>
              </div>
              <span className="text-[9px] font-mono text-[var(--text-muted)]">Pool</span>
            </div>
            <p className="font-mono text-[15px] font-bold text-[var(--text-primary)] tracking-wide transition-colors duration-300 group-hover:text-orange-400">{formatAmount(btcBalance)}</p>
            <p className="text-[9px] text-[var(--text-muted)] mt-1 font-mono tracking-wider">WALLET: {formatAmount(btcWallet)}</p>
          </div>

          <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] p-3 group transition-all duration-300 hover:border-blue-500/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 opacity-60" />
                <span className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider uppercase">USDC</span>
              </div>
              <span className="text-[9px] font-mono text-[var(--text-muted)]">Pool</span>
            </div>
            <p className="font-mono text-[15px] font-bold text-[var(--text-primary)] tracking-wide transition-colors duration-300 group-hover:text-blue-400">{formatAmount(usdcBalance)}</p>
            <p className="text-[9px] text-[var(--text-muted)] mt-1 font-mono tracking-wider">WALLET: {formatAmount(usdcWallet)}</p>
          </div>
        </div>

        {/* Token Selector */}
        <div className="flex items-center gap-1">
          {(["BTC", "USDC"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveToken(t)}
              className={`px-4 py-1.5 text-[10px] font-mono font-bold tracking-[0.15em] transition-all cursor-pointer ${
                activeToken === t
                  ? "bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/15"
                  : "text-[var(--text-muted)] border border-[var(--border-subtle)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab Switch */}
        <div className="flex border-b border-[var(--border-subtle)]">
          {(["deposit", "withdraw"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-2.5 text-[10px] font-mono font-bold uppercase tracking-[0.15em] transition-colors relative cursor-pointer ${
                activeTab === tab ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-px bg-[var(--accent)] tab-underline" />
              )}
            </button>
          ))}
        </div>

        {/* Deposit / Withdraw */}
        {activeTab === "deposit" ? (
          <div className="space-y-3">
            <input
              type="text"
              inputMode="decimal"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder={`${activeToken} amount`}
              className="w-full input-field px-4 py-3 text-[12px] font-mono"
            />
            <button
              onClick={handleDeposit}
              disabled={isDepositing || !depositAmount}
              className="w-full py-3 text-[11px] font-mono font-bold tracking-[0.1em] uppercase bg-[var(--accent)] text-[#000] hover:bg-[var(--accent-hover)] btn-terminal disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {isDepositing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round" />
                  </svg>
                  Depositing...
                </span>
              ) : `Deposit ${activeToken}`}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              inputMode="decimal"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder={`${activeToken} amount`}
              className="w-full input-field px-4 py-3 text-[12px] font-mono"
            />
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing || !withdrawAmount}
              className="w-full py-3 text-[11px] font-mono font-bold tracking-[0.1em] uppercase border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-light)] btn-terminal disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {isWithdrawing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round" />
                  </svg>
                  Withdrawing...
                </span>
              ) : `Withdraw ${activeToken}`}
            </button>
          </div>
        )}

        {/* Mint Button */}
        <button
          onClick={handleMintTestTokens}
          disabled={isMinting}
          className="w-full py-2.5 text-[10px] font-mono tracking-[0.1em] uppercase border border-dashed border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/20 btn-terminal cursor-pointer"
        >
          {isMinting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round" />
              </svg>
              Minting...
            </span>
          ) : "Mint 1,000 Test BTC + USDC"}
        </button>
      </div>
    </div>
  );
}
