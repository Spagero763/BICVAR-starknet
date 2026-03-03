"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useSendTransaction } from "@starknet-react/core";
import { Contract, RpcProvider, CallData } from "starknet";
import {
  DARKPOOL_ADDRESS,
  DARKPOOL_ABI,
  STATUS_LABELS,
  STATUS_OPEN,
  STATUS_REVEALED,
  STATUS_FILLED,
  STATUS_CANCELLED,
  SIDE_BUY,
  BTC_TOKEN_ADDRESS,
  USDC_TOKEN_ADDRESS,
} from "@/lib/contracts";

interface OrderInfo {
  orderId: number;
  trader: string;
  hash: string;
  status: number;
  timestamp: number;
  localData?: {
    side: number;
    price: string;
    amount: string;
    nonce: string;
    baseToken: string;
    quoteToken: string;
  };
}

function formatAmount(raw: string, decimals = 18): string {
  const bn = BigInt(raw);
  const whole = bn / BigInt(10 ** decimals);
  const frac = bn % BigInt(10 ** decimals);
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, 4).replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

function StatusDot({ status }: { status: number }) {
  const colors: Record<number, string> = {
    [STATUS_OPEN]: "bg-amber-400",
    [STATUS_REVEALED]: "bg-blue-400",
    [STATUS_FILLED]: "bg-emerald-400",
    [STATUS_CANCELLED]: "bg-zinc-600",
  };
  return (
    <span className="relative flex h-2 w-2">
      {(status === STATUS_OPEN || status === STATUS_REVEALED) && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${colors[status] ?? "bg-zinc-500"}`} />
      )}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colors[status] ?? "bg-zinc-500"}`} />
    </span>
  );
}

export function OrderBook() {
  const { address, isConnected } = useAccount();
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [revealingId, setRevealingId] = useState<number | null>(null);
  const [revealStatus, setRevealStatus] = useState<{ orderId: number; message: string; isError: boolean } | null>(null);
  const [selectedBuyId, setSelectedBuyId] = useState<number | null>(null);
  const [selectedSellId, setSelectedSellId] = useState<number | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchStatus, setMatchStatus] = useState<{ message: string; isError: boolean } | null>(null);

  const { sendAsync } = useSendTransaction({});

  const loadOrders = useCallback(async () => {
    if (!isConnected || DARKPOOL_ADDRESS === "0x0") return;
    setIsLoading(true);

    try {
      const provider = new RpcProvider({
        nodeUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://api.cartridge.gg/x/starknet/sepolia",
      });
      const contract = new Contract({ abi: DARKPOOL_ABI as any, address: DARKPOOL_ADDRESS, providerOrAccount: provider });

      const orderCount = await contract.get_order_count();
      const count = Number(orderCount);

      const localOrders: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("bicvar_order_") && !key.endsWith("_tx")) {
          const data = JSON.parse(localStorage.getItem(key)!);
          localOrders[data.hash] = data;
        }
      }

      const loadedOrders: OrderInfo[] = [];
      const start = Math.max(0, count - 20);
      for (let i = count - 1; i >= start; i--) {
        try {
          const commitment = await contract.get_order_commitment(i);
          const trader = commitment[0] ?? commitment.trader;
          const orderHash = commitment[1] ?? commitment.order_hash;
          const status = commitment[2] ?? commitment.status;
          const timestamp = commitment[3] ?? commitment.timestamp;
          const hashStr = typeof orderHash === "bigint" ? "0x" + orderHash.toString(16) : orderHash.toString();

          loadedOrders.push({
            orderId: i,
            trader: typeof trader === "bigint" ? "0x" + trader.toString(16) : trader.toString(),
            hash: hashStr,
            status: Number(status),
            timestamp: Number(timestamp),
            localData: localOrders[hashStr],
          });
        } catch {
          // Skip
        }
      }

      setOrders(loadedOrders);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleReveal = async (order: OrderInfo) => {
    if (!order.localData || !address) return;
    setRevealingId(order.orderId);
    setRevealStatus(null);

    try {
      const { side, price, amount, nonce, baseToken, quoteToken } = order.localData;

      const provider = new RpcProvider({
        nodeUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://api.cartridge.gg/x/starknet/sepolia",
      });
      const darkpool = new Contract({ abi: DARKPOOL_ABI as any, address: DARKPOOL_ADDRESS, providerOrAccount: provider });

      if (side === SIDE_BUY) {
        const required = BigInt(price) * BigInt(amount);
        const bal = await darkpool.get_balance(address, USDC_TOKEN_ADDRESS);
        const balBig = BigInt(bal.toString());
        if (balBig < required) {
          setRevealStatus({
            orderId: order.orderId,
            message: `Insufficient USDC in pool. Need ${required.toString()} but have ${balBig.toString()}. Deposit USDC first.`,
            isError: true,
          });
          setRevealingId(null);
          return;
        }
      } else {
        const required = BigInt(amount);
        const bal = await darkpool.get_balance(address, BTC_TOKEN_ADDRESS);
        const balBig = BigInt(bal.toString());
        if (balBig < required) {
          setRevealStatus({
            orderId: order.orderId,
            message: `Insufficient BTC in pool. Need ${required.toString()} but have ${balBig.toString()}. Deposit BTC first.`,
            isError: true,
          });
          setRevealingId(null);
          return;
        }
      }

      setRevealStatus({ orderId: order.orderId, message: "Waiting for wallet approval...", isError: false });

      const result = await sendAsync([
        {
          contractAddress: DARKPOOL_ADDRESS,
          entrypoint: "reveal_order",
          calldata: CallData.compile({
            order_id: order.orderId,
            base_token: baseToken,
            quote_token: quoteToken,
            side,
            price: { low: BigInt(price) & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), high: BigInt(price) >> 128n },
            amount: { low: BigInt(amount) & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), high: BigInt(amount) >> 128n },
            nonce,
          }),
        },
      ]);

      setRevealStatus({ orderId: order.orderId, message: "Tx sent! Waiting for confirmation...", isError: false });
      await provider.waitForTransaction(result.transaction_hash);

      setRevealStatus({ orderId: order.orderId, message: "Revealed successfully!", isError: false });
      await loadOrders();
      setTimeout(() => setRevealStatus(null), 3000);
    } catch (err) {
      console.error("Reveal failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setRevealStatus({
        orderId: order.orderId,
        message: msg.includes("User abort") || msg.includes("reject")
          ? "Transaction rejected by user"
          : `Reveal failed: ${msg.slice(0, 120)}`,
        isError: true,
      });
    } finally {
      setRevealingId(null);
    }
  };

  const handleCancel = async (orderId: number) => {
    if (!address) return;

    try {
      await sendAsync([
        {
          contractAddress: DARKPOOL_ADDRESS,
          entrypoint: "cancel_order",
          calldata: CallData.compile({ order_id: orderId }),
        },
      ]);
      const provider = new RpcProvider({
        nodeUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://api.cartridge.gg/x/starknet/sepolia",
      });
      await loadOrders();
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  };

  const handleMatch = async () => {
    if (selectedBuyId === null || selectedSellId === null || !address) return;
    setIsMatching(true);
    setMatchStatus(null);

    try {
      setMatchStatus({ message: "Waiting for wallet approval...", isError: false });

      const result = await sendAsync([
        {
          contractAddress: DARKPOOL_ADDRESS,
          entrypoint: "match_orders",
          calldata: CallData.compile({
            buy_order_id: selectedBuyId,
            sell_order_id: selectedSellId,
          }),
        },
      ]);

      setMatchStatus({ message: "Tx sent! Waiting for confirmation...", isError: false });
      const provider = new RpcProvider({
        nodeUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://api.cartridge.gg/x/starknet/sepolia",
      });
      await provider.waitForTransaction(result.transaction_hash);

      setMatchStatus({ message: "Orders matched & settled!", isError: false });
      setSelectedBuyId(null);
      setSelectedSellId(null);
      await loadOrders();
      setTimeout(() => setMatchStatus(null), 4000);
    } catch (err) {
      console.error("Match failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setMatchStatus({
        message: msg.includes("User abort") || msg.includes("reject")
          ? "Transaction rejected by user"
          : msg.includes("No price overlap")
            ? "No price overlap — buy price must be ≥ sell price"
            : msg.includes("not revealed")
              ? "Both orders must be in Revealed status"
              : `Match failed: ${msg.slice(0, 120)}`,
        isError: true,
      });
    } finally {
      setIsMatching(false);
    }
  };

  const revealedBuys = orders.filter(o => o.status === STATUS_REVEALED && o.localData?.side === SIDE_BUY);
  const revealedSells = orders.filter(o => o.status === STATUS_REVEALED && o.localData?.side !== SIDE_BUY);
  const canMatch = selectedBuyId !== null && selectedSellId !== null && !isMatching;

  const statusColor = (status: number) => {
    switch (status) {
      case STATUS_OPEN: return "text-amber-400";
      case STATUS_REVEALED: return "text-blue-400";
      case STATUS_FILLED: return "text-emerald-400";
      case STATUS_CANCELLED: return "text-[var(--text-muted)]";
      default: return "text-[var(--text-muted)]";
    }
  };

  const isMyOrder = (trader: string) => {
    if (!address) return false;
    const normalize = (addr: string) => {
      const stripped = addr.replace(/^0x0*/i, "");
      return stripped.toLowerCase();
    };
    return normalize(trader) === normalize(address);
  };

  return (
    <div className="card rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
              <path d="M3 12h4l3-9 4 18 3-9h4" />
            </svg>
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Order Book</h2>
            <p className="text-[11px] text-[var(--text-muted)]">{orders.length} orders</p>
          </div>
        </div>
        <motion.button
          onClick={loadOrders}
          disabled={isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-default)] transition-all"
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round" />
              </svg>
              Syncing
            </span>
          ) : "Refresh"}
        </motion.button>
      </div>

      {(revealedBuys.length > 0 || revealedSells.length > 0) && (
        <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-medium text-[var(--text-muted)]">Buy</span>
                <select
                  value={selectedBuyId ?? ""}
                  onChange={(e) => setSelectedBuyId(e.target.value ? Number(e.target.value) : null)}
                  className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-[12px] font-mono text-emerald-400 focus:outline-none focus:border-emerald-500/40 min-w-[120px]"
                >
                  <option value="">Select buy...</option>
                  {revealedBuys.map((o) => (
                    <option key={o.orderId} value={o.orderId}>
                      #{o.orderId} — {o.localData ? `${formatAmount(o.localData.amount)} @ ${o.localData.price}` : o.hash.slice(0, 10)}
                    </option>
                  ))}
                </select>
              </div>

              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)] shrink-0">
                <path d="M18 8L22 12L18 16" />
                <path d="M2 12H22" />
              </svg>

              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-medium text-[var(--text-muted)]">Sell</span>
                <select
                  value={selectedSellId ?? ""}
                  onChange={(e) => setSelectedSellId(e.target.value ? Number(e.target.value) : null)}
                  className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-[12px] font-mono text-red-400 focus:outline-none focus:border-red-500/40 min-w-[120px]"
                >
                  <option value="">Select sell...</option>
                  {revealedSells.map((o) => (
                    <option key={o.orderId} value={o.orderId}>
                      #{o.orderId} — {o.localData ? `${formatAmount(o.localData.amount)} @ ${o.localData.price}` : o.hash.slice(0, 10)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <motion.button
              onClick={handleMatch}
              disabled={!canMatch}
              whileHover={canMatch ? { scale: 1.03 } : {}}
              whileTap={canMatch ? { scale: 0.97 } : {}}
              className={`px-4 py-1.5 text-[12px] font-semibold rounded-lg border transition-all duration-200 flex items-center gap-2 ${
                canMatch
                  ? "bg-gradient-to-b from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white border-violet-500/30 shadow-lg shadow-violet-500/15"
                  : "bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)] opacity-50 cursor-not-allowed"
              }`}
            >
              {isMatching ? (
                <>
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round" />
                  </svg>
                  Matching...
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                  </svg>
                  Match Orders
                </>
              )}
            </motion.button>
          </div>

          {matchStatus && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-2 text-[11px] font-medium ${
                matchStatus.isError ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {matchStatus.message}
            </motion.p>
          )}

          {revealedSells.length === 0 && (
            <p className="mt-2 text-[10px] text-amber-400/70 flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              No revealed SELL orders yet. Create a sell order to enable matching.
            </p>
          )}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)]">
              <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l4.58-4.58c.94-.94.94-2.48 0-3.42L9 5z" />
              <circle cx="6" cy="9" r="1" fill="currentColor" />
            </svg>
          </div>
          <p className="text-[13px] text-[var(--text-muted)]">
            {DARKPOOL_ADDRESS === "0x0" ? "Contract not deployed" : "No orders yet"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-subtle)]">
          <div className="grid grid-cols-[40px_1fr_90px_1fr_auto] gap-3 px-5 py-2.5 text-[10px] uppercase tracking-wider font-medium text-[var(--text-muted)]">
            <span>ID</span>
            <span>Hash</span>
            <span>Status</span>
            <span>Details</span>
            <span className="text-right">Actions</span>
          </div>

          <AnimatePresence>
            {orders.map((order, i) => (
              <motion.div
                key={order.orderId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className={`grid grid-cols-[40px_1fr_90px_1fr_auto] gap-3 items-center px-5 py-3 text-[13px] transition-colors ${
                  isMyOrder(order.trader)
                    ? "bg-blue-500/[0.03] hover:bg-blue-500/[0.06]"
                    : "hover:bg-[var(--bg-elevated)]/50"
                }`}
              >
                <span className="font-mono text-[var(--text-muted)] text-[12px]">{order.orderId}</span>

                <span className="font-mono text-[12px] text-[var(--text-muted)] truncate" title={order.hash}>
                  {order.hash.slice(0, 10)}…
                </span>

                <span className={`flex items-center gap-1.5 text-[12px] font-medium ${statusColor(order.status)}`}>
                  <StatusDot status={order.status} />
                  {STATUS_LABELS[order.status] || "—"}
                </span>

                <span className="text-[12px]">
                  {order.localData ? (
                    <span className="flex items-center gap-1">
                      <span className={`font-semibold ${order.localData.side === SIDE_BUY ? "text-emerald-400" : "text-red-400"}`}>
                        {order.localData.side === SIDE_BUY ? "BUY" : "SELL"}
                      </span>
                      <span className="text-[var(--text-secondary)] font-mono">
                        {formatAmount(order.localData.amount)}
                      </span>
                      <span className="text-[var(--text-muted)]">@</span>
                      <span className="text-[var(--text-secondary)] font-mono">
                        {order.localData.price}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)] italic flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      {isMyOrder(order.trader) ? "Your order" : "Encrypted"}
                    </span>
                  )}
                </span>

                <div className="flex gap-1.5 justify-end">
                  {isMyOrder(order.trader) && order.status === STATUS_OPEN && order.localData && (
                    <div className="flex flex-col items-end gap-1">
                      <motion.button
                        onClick={() => handleReveal(order)}
                        disabled={revealingId === order.orderId}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-2.5 py-1 text-[11px] font-medium bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 rounded-lg transition-colors disabled:opacity-40 border border-blue-500/20"
                      >
                        {revealingId === order.orderId ? (
                          <span className="flex items-center gap-1.5">
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round" />
                            </svg>
                            {revealStatus?.orderId === order.orderId ? "..." : ""}
                          </span>
                        ) : "Reveal"}
                      </motion.button>
                      {revealStatus?.orderId === order.orderId && (
                        <span className={`text-[10px] max-w-[200px] text-right leading-tight ${
                          revealStatus.isError ? "text-red-400" : "text-emerald-400"
                        }`}>
                          {revealStatus.message}
                        </span>
                      )}
                    </div>
                  )}
                  {isMyOrder(order.trader) &&
                    (order.status === STATUS_OPEN || order.status === STATUS_REVEALED) && (
                      <motion.button
                        onClick={() => handleCancel(order.orderId)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-2.5 py-1 text-[11px] font-medium bg-[var(--bg-elevated)] hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 rounded-lg transition-all border border-[var(--border-subtle)] hover:border-red-500/20"
                      >
                        Cancel
                      </motion.button>
                    )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
