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
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)]">
        <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Vault</h2>
        <button
          onClick={loadBalances}
          className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
        >
          Refresh
        </button>
      </div>

      <div className="p-6 space-y-5">
        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center text-[10px] font-bold text-orange-400">B</span>
              <span className="text-[12px] font-medium text-[var(--text-muted)]">BTC</span>
            </div>
            <p className="font-mono text-[17px] font-semibold text-[var(--text-primary)]">{formatAmount(btcBalance)}</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 font-mono">Wallet: {formatAmount(btcWallet)}</p>
          </div>
          <div className="bg-[var(--bg-primary)] rounded-xl p-4 border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-400">U</span>
              <span className="text-[12px] font-medium text-[var(--text-muted)]">USDC</span>
            </div>
            <p className="font-mono text-[17px] font-semibold text-[var(--text-primary)]">{formatAmount(usdcBalance)}</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 font-mono">Wallet: {formatAmount(usdcWallet)}</p>
          </div>
        </div>

        {/* Token Selector */}
        <div className="flex items-center gap-2">
          {(["BTC", "USDC"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveToken(t)}
              className={`px-4 py-2 text-[12px] font-medium rounded-lg transition-all cursor-pointer ${
                activeToken === t
                  ? "bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/20"
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
              className={`flex-1 pb-3 text-[13px] font-medium capitalize transition-colors relative cursor-pointer ${
                activeTab === tab ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)]" />
              )}
            </button>
          ))}
        </div>

        {/* Deposit / Withdraw */}
        {activeTab === "deposit" ? (
          <div className="flex gap-3">
            <input
              type="text"
              inputMode="decimal"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder={`${activeToken} amount`}
              className="flex-1 input-field rounded-xl px-4 py-3 text-[14px] font-mono"
            />
            <button
              onClick={handleDeposit}
              disabled={isDepositing || !depositAmount}
              className="px-6 py-3 text-[13px] font-semibold bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isDepositing ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round" />
                </svg>
              ) : "Deposit"}
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <input
              type="text"
              inputMode="decimal"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder={`${activeToken} amount`}
              className="flex-1 input-field rounded-xl px-4 py-3 text-[14px] font-mono"
            />
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing || !withdrawAmount}
              className="px-6 py-3 text-[13px] font-semibold border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-active)] rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isWithdrawing ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round" />
                </svg>
              ) : "Withdraw"}
            </button>
          </div>
        )}

        {/* Mint Button */}
        <button
          onClick={handleMintTestTokens}
          disabled={isMinting}
          className="w-full py-3 text-[13px] font-medium border border-dashed border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 rounded-xl transition-all cursor-pointer"
        >
          {isMinting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
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
