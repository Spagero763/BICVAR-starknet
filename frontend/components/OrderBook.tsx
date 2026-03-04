"use client";

import { useState, useEffect, useCallback } from "react";
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

function StatusBadge({ status }: { status: number }) {
  const config: Record<number, { bg: string; text: string }> = {
    [STATUS_OPEN]: { bg: "bg-amber-400/10", text: "text-amber-400" },
    [STATUS_REVEALED]: { bg: "bg-[var(--accent-light)]", text: "text-[var(--accent)]" },
    [STATUS_FILLED]: { bg: "bg-emerald-400/10", text: "text-emerald-400" },
    [STATUS_CANCELLED]: { bg: "bg-neutral-400/10", text: "text-neutral-500" },
  };
  const c = config[status] || { bg: "bg-neutral-400/10", text: "text-neutral-500" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${c.bg} ${c.text}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status] || "Unknown"}
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
            ? "No price overlap — buy price must be >= sell price"
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

  const isMyOrder = (trader: string) => {
    if (!address) return false;
    const normalize = (addr: string) => addr.replace(/^0x0*/i, "").toLowerCase();
    return normalize(trader) === normalize(address);
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Order Book</h2>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">{orders.length} orders</p>
        </div>
        <button
          onClick={loadOrders}
          disabled={isLoading}
          className="px-4 py-2 text-[12px] font-medium rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-active)] transition-all cursor-pointer disabled:opacity-40"
        >
          {isLoading ? "Syncing..." : "Refresh"}
        </button>
      </div>

      {/* Match Section */}
      {(revealedBuys.length > 0 || revealedSells.length > 0) && (
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Match Orders</p>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedBuyId ?? ""}
              onChange={(e) => setSelectedBuyId(e.target.value ? Number(e.target.value) : null)}
              className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[12px] font-mono text-emerald-400 focus:outline-none focus:border-[var(--accent)] min-w-[140px] cursor-pointer"
            >
              <option value="">Select buy order</option>
              {revealedBuys.map((o) => (
                <option key={o.orderId} value={o.orderId}>
                  #{o.orderId} — {o.localData ? `${formatAmount(o.localData.amount)} @ ${o.localData.price}` : o.hash.slice(0, 10)}
                </option>
              ))}
            </select>

            <span className="text-[var(--text-muted)] text-[12px]">with</span>

            <select
              value={selectedSellId ?? ""}
              onChange={(e) => setSelectedSellId(e.target.value ? Number(e.target.value) : null)}
              className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[12px] font-mono text-red-400 focus:outline-none focus:border-[var(--accent)] min-w-[140px] cursor-pointer"
            >
              <option value="">Select sell order</option>
              {revealedSells.map((o) => (
                <option key={o.orderId} value={o.orderId}>
                  #{o.orderId} — {o.localData ? `${formatAmount(o.localData.amount)} @ ${o.localData.price}` : o.hash.slice(0, 10)}
                </option>
              ))}
            </select>

            <button
              onClick={handleMatch}
              disabled={!canMatch}
              className={`px-5 py-2 text-[12px] font-semibold rounded-lg transition-all cursor-pointer ${
                canMatch
                  ? "bg-[var(--accent)] text-[#0a0a0a] hover:bg-[var(--accent-hover)]"
                  : "bg-[var(--bg-elevated)] text-[var(--text-muted)] opacity-50 cursor-not-allowed"
              }`}
            >
              {isMatching ? "Matching..." : "Match Orders"}
            </button>
          </div>

          {matchStatus && (
            <p className={`mt-3 text-[12px] font-medium ${matchStatus.isError ? "text-red-400" : "text-emerald-400"}`}>
              {matchStatus.message}
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)]">
              <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l4.58-4.58c.94-.94.94-2.48 0-3.42L9 5z" />
              <circle cx="6" cy="9" r="1" fill="currentColor" />
            </svg>
          </div>
          <p className="text-[14px] text-[var(--text-muted)]">
            {DARKPOOL_ADDRESS === "0x0" ? "Contract not deployed" : "No orders yet"}
          </p>
        </div>
      ) : (
        <div>
          {/* Table Header */}
          <div className="grid grid-cols-[50px_1fr_100px_1fr_auto] gap-4 px-6 py-3 text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-subtle)]">
            <span>ID</span>
            <span>Hash</span>
            <span>Status</span>
            <span>Details</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Orders */}
          {orders.map((order) => (
            <div
              key={order.orderId}
              className={`grid grid-cols-[50px_1fr_100px_1fr_auto] gap-4 items-center px-6 py-4 border-b border-[var(--border-subtle)] transition-colors ${
                isMyOrder(order.trader)
                  ? "bg-[var(--accent-light)]/30"
                  : "hover:bg-[var(--bg-secondary)]"
              }`}
            >
              <span className="font-mono text-[13px] text-[var(--text-muted)]">{order.orderId}</span>

              <span className="font-mono text-[12px] text-[var(--text-muted)] truncate" title={order.hash}>
                {order.hash.slice(0, 12)}...
              </span>

              <StatusBadge status={order.status} />

              <span className="text-[13px]">
                {order.localData ? (
                  <span className="flex items-center gap-2">
                    <span className={`font-semibold ${order.localData.side === SIDE_BUY ? "text-emerald-400" : "text-red-400"}`}>
                      {order.localData.side === SIDE_BUY ? "BUY" : "SELL"}
                    </span>
                    <span className="text-[var(--text-secondary)] font-mono">
                      {formatAmount(order.localData.amount)} @ {order.localData.price}
                    </span>
                  </span>
                ) : (
                  <span className="text-[var(--text-muted)] italic">
                    {isMyOrder(order.trader) ? "Your order" : "Hidden"}
                  </span>
                )}
              </span>

              <div className="flex gap-2 justify-end">
                {isMyOrder(order.trader) && order.status === STATUS_OPEN && order.localData && (
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={() => handleReveal(order)}
                      disabled={revealingId === order.orderId}
                      className="px-3 py-1.5 text-[11px] font-medium bg-[var(--accent)] text-[#0a0a0a] rounded-lg hover:bg-[var(--accent-hover)] transition-all disabled:opacity-40 cursor-pointer"
                    >
                      {revealingId === order.orderId ? "Revealing..." : "Reveal"}
                    </button>
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
                    <button
                      onClick={() => handleCancel(order.orderId)}
                      className="px-3 py-1.5 text-[11px] font-medium border border-[var(--border-default)] text-[var(--text-muted)] hover:text-red-400 hover:border-red-400/30 rounded-lg transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
