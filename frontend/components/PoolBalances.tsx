"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
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

function BalanceCard({ label, icon, pool, wallet }: { label: string; icon: React.ReactNode; pool: bigint; wallet: bigint }) {
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
      </div>
      <div>
        <p className="font-mono text-[16px] font-semibold text-[var(--text-primary)] leading-none">{formatAmount(pool)}</p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-mono">
          Wallet: {formatAmount(wallet)}
        </p>
      </div>
    </div>
  );
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
    <div className="card rounded-2xl overflow-hidden glow-accent">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
          </div>
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Vault</h2>
        </div>
        <motion.button
          onClick={loadBalances}
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.3 }}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
        </motion.button>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <BalanceCard
            label="BTC"
            icon={
              <div className="w-5 h-5 rounded-full bg-orange-500/15 flex items-center justify-center">
                <span className="text-[10px] font-bold text-orange-400">B</span>
              </div>
            }
            pool={btcBalance}
            wallet={btcWallet}
          />
          <BalanceCard
            label="USDC"
            icon={
              <div className="w-5 h-5 rounded-full bg-blue-500/15 flex items-center justify-center">
                <span className="text-[10px] font-bold text-blue-400">U</span>
              </div>
            }
            pool={usdcBalance}
            wallet={usdcWallet}
          />
        </div>

        <div className="flex items-center gap-2">
          {(["BTC", "USDC"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveToken(t)}
              className={`px-3.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200 ${
                activeToken === t
                  ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/25"
                  : "bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {t}
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Active Token</span>
        </div>

        <div className="flex border-b border-[var(--border-subtle)]">
          {(["deposit", "withdraw"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-2.5 text-[12px] font-medium capitalize transition-colors relative ${
                activeTab === tab ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="vault-tab"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)]"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>

        {activeTab === "deposit" ? (
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder={`${activeToken} amount`}
              className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-default)] rounded-xl px-4 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/40 focus:outline-none font-mono transition-colors"
            />
            <motion.button
              onClick={handleDeposit}
              disabled={isDepositing || !depositAmount}
              whileHover={{ scale: isDepositing ? 1 : 1.02 }}
              whileTap={{ scale: isDepositing ? 1 : 0.97 }}
              className="px-5 py-2.5 text-[13px] font-semibold bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-emerald-800/40 disabled:to-emerald-900/40 text-white disabled:text-emerald-300/30 rounded-xl shadow-lg shadow-emerald-500/10 transition-all disabled:cursor-not-allowed"
            >
              {isDepositing ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round" />
                </svg>
              ) : "Deposit"}
            </motion.button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder={`${activeToken} amount`}
              className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-default)] rounded-xl px-4 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/40 focus:outline-none font-mono transition-colors"
            />
            <motion.button
              onClick={handleWithdraw}
              disabled={isWithdrawing || !withdrawAmount}
              whileHover={{ scale: isWithdrawing ? 1 : 1.02 }}
              whileTap={{ scale: isWithdrawing ? 1 : 0.97 }}
              className="px-5 py-2.5 text-[13px] font-semibold bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]/80 border border-[var(--border-subtle)] hover:border-[var(--border-default)] text-[var(--text-secondary)] rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isWithdrawing ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round" />
                </svg>
              ) : "Withdraw"}
            </motion.button>
          </div>
        )}

        <motion.button
          onClick={handleMintTestTokens}
          disabled={isMinting}
          whileHover={{ scale: isMinting ? 1 : 1.01 }}
          whileTap={{ scale: isMinting ? 1 : 0.98 }}
          className="w-full py-2.5 text-[12px] font-medium bg-transparent hover:bg-[var(--bg-elevated)] border border-dashed border-[var(--border-subtle)] hover:border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] rounded-xl transition-all"
        >
          {isMinting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round" />
              </svg>
              Minting...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              Mint 1,000 Test BTC + USDC
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
}
