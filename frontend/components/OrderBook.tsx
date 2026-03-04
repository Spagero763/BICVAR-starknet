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
  const config: Record<number, { color: string }> = {
    [STATUS_OPEN]: { color: "text-amber-400" },
    [STATUS_REVEALED]: { color: "text-[var(--cyan)]" },
    [STATUS_FILLED]: { color: "text-[var(--accent)]" },
    [STATUS_CANCELLED]: { color: "text-neutral-600" },
  };
  const c = config[status] || { color: "text-neutral-600" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase ${c.color}`}>
      <span className={`w-1 h-1 bg-current ${status === STATUS_OPEN || status === STATUS_REVEALED ? 'status-live' : ''}`} />
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
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <p className="text-[9px] font-mono text-[var(--text-muted)] tracking-[0.2em] uppercase">// Order Book</p>
          <span className="text-[9px] font-mono text-[var(--text-muted)]">[{orders.length}]</span>
        </div>
        <button
          onClick={loadOrders}
          disabled={isLoading}
          className="px-3 py-1.5 text-[9px] font-mono tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/15 transition-all cursor-pointer disabled:opacity-30"
        >
          {isLoading ? "Syncing..." : "Refresh"}
        </button>
      </div>

      {/* Match Section */}
      {(revealedBuys.length > 0 || revealedSells.length > 0) && (
        <div className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <p className="text-[9px] font-mono text-[var(--accent)] tracking-[0.2em] uppercase mb-3 opacity-60">// Match Engine</p>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
            <select
              value={selectedBuyId ?? ""}
              onChange={(e) => setSelectedBuyId(e.target.value ? Number(e.target.value) : null)}
              className="bg-[var(--bg-card)] border border-[var(--border-subtle)] px-3 py-2 text-[10px] font-mono text-[var(--accent)] focus:outline-none focus:border-[var(--accent)]/30 w-full sm:min-w-[140px] sm:w-auto cursor-pointer"
            >
              <option value="">Buy order</option>
              {revealedBuys.map((o) => (
                <option key={o.orderId} value={o.orderId}>
                  #{o.orderId} — {o.localData ? `${formatAmount(o.localData.amount)} @ ${o.localData.price}` : o.hash.slice(0, 10)}
                </option>
              ))}
            </select>

            <span className="text-[var(--text-muted)] text-[10px] font-mono hidden sm:inline">×</span>

            <select
              value={selectedSellId ?? ""}
              onChange={(e) => setSelectedSellId(e.target.value ? Number(e.target.value) : null)}
              className="bg-[var(--bg-card)] border border-[var(--border-subtle)] px-3 py-2 text-[10px] font-mono text-[var(--sell)] focus:outline-none focus:border-[var(--accent)]/30 w-full sm:min-w-[140px] sm:w-auto cursor-pointer"
            >
              <option value="">Sell order</option>
              {revealedSells.map((o) => (
                <option key={o.orderId} value={o.orderId}>
                  #{o.orderId} — {o.localData ? `${formatAmount(o.localData.amount)} @ ${o.localData.price}` : o.hash.slice(0, 10)}
                </option>
              ))}
            </select>

            <button
              onClick={handleMatch}
              disabled={!canMatch}
              className={`px-4 py-2 text-[10px] font-mono font-bold tracking-[0.1em] uppercase btn-terminal cursor-pointer ${
                canMatch
                  ? "bg-[var(--accent)] text-[#000] hover:bg-[var(--accent-hover)]"
                  : "bg-[var(--bg-elevated)] text-[var(--text-muted)] opacity-40 cursor-not-allowed"
              }`}
            >
              {isMatching ? "Matching..." : "Execute Match"}
            </button>
          </div>

          {matchStatus && (
            <p className={`mt-2 text-[10px] font-mono ${matchStatus.isError ? "text-[var(--sell)]" : "text-[var(--accent)]"}`}>
              {matchStatus.message}
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 fade-in">
          <div className="w-8 h-8 border border-[var(--border-default)] flex items-center justify-center float">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)]">
              <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l4.58-4.58c.94-.94.94-2.48 0-3.42L9 5z" />
              <circle cx="6" cy="9" r="1" fill="currentColor" />
            </svg>
          </div>
          <p className="text-[11px] font-mono text-[var(--text-muted)] tracking-wider">
            {DARKPOOL_ADDRESS === "0x0" ? "// Contract not deployed" : "// No orders found"}
          </p>
        </div>
      ) : (
        <div>
          {/* Desktop Table Header - hidden on mobile */}
          <div className="hidden md:grid grid-cols-[45px_1fr_90px_1fr_auto] gap-3 px-5 py-2.5 text-[9px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <span>ID</span>
            <span>Hash</span>
            <span>Status</span>
            <span>Details</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Orders - Desktop row / Mobile card */}
          {orders.map((order, idx) => (
            <div
              key={order.orderId}
              className={`border-b border-[var(--border-subtle)] order-row row-reveal stagger-${Math.min(idx + 1, 8)} ${
                isMyOrder(order.trader)
                  ? "bg-[var(--accent-light)]/40 border-l-2 border-l-[var(--accent)]/20"
                  : ""
              }`}
            >
              {/* Desktop layout */}
              <div className="hidden md:grid grid-cols-[45px_1fr_90px_1fr_auto] gap-3 items-center px-5 py-3">
                <span className="font-mono text-[11px] text-[var(--text-muted)]">#{order.orderId}</span>
                <span className="font-mono text-[10px] text-[var(--text-muted)] truncate opacity-60" title={order.hash}>
                  {order.hash.slice(0, 14)}...
                </span>
                <StatusBadge status={order.status} />
                <span className="text-[11px] font-mono">
                  {order.localData ? (
                    <span className="flex items-center gap-2">
                      <span className={`font-bold tracking-[0.1em] ${order.localData.side === SIDE_BUY ? "text-[var(--accent)]" : "text-[var(--sell)]"}`}>
                        {order.localData.side === SIDE_BUY ? "BUY" : "SELL"}
                      </span>
                      <span className="text-[var(--text-secondary)]">
                        {formatAmount(order.localData.amount)} @ {order.localData.price}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)] italic opacity-50">
                      {isMyOrder(order.trader) ? "// Your order" : "// Encrypted"}
                    </span>
                  )}
                </span>
                <div className="flex gap-1.5 justify-end">
                  {isMyOrder(order.trader) && order.status === STATUS_OPEN && order.localData && (
                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={() => handleReveal(order)}
                        disabled={revealingId === order.orderId}
                        className="px-3 py-1 text-[9px] font-mono font-bold tracking-[0.1em] uppercase bg-[var(--accent)] text-[#000] hover:bg-[var(--accent-hover)] btn-terminal disabled:opacity-30 cursor-pointer"
                      >
                        {revealingId === order.orderId ? "..." : "Reveal"}
                      </button>
                      {revealStatus?.orderId === order.orderId && (
                        <span className={`text-[9px] font-mono max-w-[200px] text-right leading-tight ${
                          revealStatus.isError ? "text-[var(--sell)]" : "text-[var(--accent)]"
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
                        className="px-3 py-1 text-[9px] font-mono font-bold tracking-[0.1em] uppercase border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--sell)] hover:border-[var(--sell)]/20 btn-terminal cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                </div>
              </div>

              {/* Mobile card layout */}
              <div className="md:hidden px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">#{order.orderId}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <span className="font-mono text-[9px] text-[var(--text-muted)] opacity-60" title={order.hash}>
                    {order.hash.slice(0, 10)}...
                  </span>
                </div>
                <div className="text-[11px] font-mono">
                  {order.localData ? (
                    <span className="flex items-center gap-2">
                      <span className={`font-bold tracking-[0.1em] ${order.localData.side === SIDE_BUY ? "text-[var(--accent)]" : "text-[var(--sell)]"}`}>
                        {order.localData.side === SIDE_BUY ? "BUY" : "SELL"}
                      </span>
                      <span className="text-[var(--text-secondary)]">
                        {formatAmount(order.localData.amount)} @ {order.localData.price}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)] italic opacity-50">
                      {isMyOrder(order.trader) ? "// Your order" : "// Encrypted"}
                    </span>
                  )}
                </div>
                {isMyOrder(order.trader) && (
                  <div className="flex gap-2 pt-1">
                    {order.status === STATUS_OPEN && order.localData && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleReveal(order)}
                          disabled={revealingId === order.orderId}
                          className="px-3 py-1.5 text-[9px] font-mono font-bold tracking-[0.1em] uppercase bg-[var(--accent)] text-[#000] hover:bg-[var(--accent-hover)] btn-terminal disabled:opacity-30 cursor-pointer"
                        >
                          {revealingId === order.orderId ? "..." : "Reveal"}
                        </button>
                        {revealStatus?.orderId === order.orderId && (
                          <span className={`text-[9px] font-mono leading-tight ${
                            revealStatus.isError ? "text-[var(--sell)]" : "text-[var(--accent)]"
                          }`}>
                            {revealStatus.message}
                          </span>
                        )}
                      </div>
                    )}
                    {(order.status === STATUS_OPEN || order.status === STATUS_REVEALED) && (
                      <button
                        onClick={() => handleCancel(order.orderId)}
                        className="px-3 py-1.5 text-[9px] font-mono font-bold tracking-[0.1em] uppercase border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--sell)] hover:border-[var(--sell)]/20 btn-terminal cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
