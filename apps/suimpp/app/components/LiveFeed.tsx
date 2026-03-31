'use client';

import { useEffect, useState } from 'react';

interface Payment {
  id: number;
  amount: string;
  digest: string | null;
  sender: string | null;
  network: string;
  createdAt: string;
  server: { name: string };
}

function timeAgo(date: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000,
  );
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatUSDC(amount: string) {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  if (num < 0.01) return `${num.toFixed(4)} USDC`;
  return `${num.toFixed(3)} USDC`;
}

function truncateDigest(digest: string) {
  if (digest.length <= 12) return digest;
  return `${digest.slice(0, 7)}...${digest.slice(-4)}`;
}

function truncateAddress(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function suiscanUrl(digest: string, network: string) {
  return `https://suiscan.xyz/${network}/tx/${digest}`;
}

export function LiveFeed() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetch('/api/payments?limit=15');
        if (res.ok) {
          const data = await res.json();
          setPayments(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
    const interval = setInterval(fetchPayments, 5_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium">Live Payments</span>
          <span className="w-2 h-2 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-border/30 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Live Payments</span>
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
        </div>
        {payments.length > 0 && (
          <span className="text-[11px] text-muted font-mono">
            across all servers
          </span>
        )}
      </div>

      {payments.length === 0 ? (
        <div className="p-8 text-center space-y-2">
          <p className="text-muted text-sm">No payments yet</p>
          <p className="text-muted/60 text-xs">
            Payments from registered MPP servers appear here in real-time.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 text-[10px] uppercase tracking-wider text-muted/60 border-b border-border/50">
            <span>Server</span>
            <span>Transaction</span>
            <span className="text-right">Amount</span>
            <span className="text-right w-16">Time</span>
          </div>
          <div className="divide-y divide-border/50">
            {payments.map((p) => (
              <div
                key={p.id}
                className="group px-4 py-2.5 hover:bg-border/10 transition-colors"
              >
                <div className="sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:gap-4 sm:items-center flex flex-col gap-1">
                  <div className="min-w-0">
                    <span className="text-xs text-text font-medium">
                      {p.server.name}
                    </span>
                    {p.sender && (
                      <span className="text-[11px] font-mono text-muted ml-2 hidden lg:inline">
                        from {truncateAddress(p.sender)}
                      </span>
                    )}
                  </div>

                  <div className="font-mono text-[11px]">
                    {p.digest ? (
                      <a
                        href={suiscanUrl(p.digest, p.network || 'mainnet')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted hover:text-accent transition-colors"
                        title={p.digest}
                      >
                        {truncateDigest(p.digest)}
                        <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                      </a>
                    ) : (
                      <span className="text-muted/40">pending</span>
                    )}
                  </div>

                  <span className="font-mono text-xs text-text text-right whitespace-nowrap">
                    {formatUSDC(p.amount)}
                  </span>

                  <span className="font-mono text-[11px] text-muted text-right w-16 whitespace-nowrap">
                    {timeAgo(p.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
