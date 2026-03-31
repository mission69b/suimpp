'use client';

import { useEffect, useState, useCallback } from 'react';
import { VolumeChart } from './VolumeChart';
import { ServerBreakdown } from './ServerBreakdown';
import { PaymentTable } from './PaymentTable';

interface Stats {
  totalPayments: number;
  totalVolume: number;
  serverCount: number;
  byServer: { id: number; name: string; count: number; volume: number }[];
  volumeTimeline: { date: string; volume: number }[];
}

interface Payment {
  id: number;
  digest: string | null;
  sender: string | null;
  recipient: string | null;
  amount: string;
  currency: string | null;
  network: string;
  createdAt: string;
  server: { name: string; url: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export type SortField = 'createdAt' | 'amount';
export type SortOrder = 'asc' | 'desc';

export function ExplorerContent() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, pages: 0 });
  const [serverFilter, setServerFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/explorer/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const fetchPayments = useCallback(
    async (page: number) => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '25', sort: sortField, order: sortOrder });
      if (serverFilter) params.set('server', serverFilter);
      try {
        const res = await fetch(`/api/explorer?${params}`);
        const data = await res.json();
        setPayments(data.payments);
        setPagination(data.pagination);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    },
    [serverFilter, sortField, sortOrder],
  );

  useEffect(() => {
    fetchPayments(1);
  }, [fetchPayments]);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
        return prev;
      }
      setSortOrder('desc');
      return field;
    });
  }, []);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-medium">Payment Explorer</h1>
        <p className="text-sm text-muted">
          On-chain proof that machine payments are real.
        </p>
      </header>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Payments" value={stats.totalPayments.toLocaleString()} />
          <StatCard label="Volume" value={`$${stats.totalVolume.toLocaleString()}`} />
          <StatCard label="Servers" value={String(stats.serverCount)} />
          <StatCard
            label="Avg / Payment"
            value={
              stats.totalPayments > 0
                ? `$${(stats.totalVolume / stats.totalPayments).toFixed(4)}`
                : '$0'
            }
          />
        </div>
      )}

      {/* Charts */}
      {stats && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <VolumeChart data={stats.volumeTimeline} />
          </div>
          <ServerBreakdown data={stats.byServer} />
        </div>
      )}

      {/* Filter */}
      {stats && stats.byServer.length > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">Filter:</span>
          <select
            value={serverFilter}
            onChange={(e) => setServerFilter(e.target.value)}
            className="text-xs bg-surface border border-border rounded-md px-3 py-1.5 text-text focus:outline-none focus:border-accent/50 cursor-pointer"
          >
            <option value="">All servers</option>
            {stats.byServer.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Payment Table */}
      <PaymentTable
        payments={payments}
        pagination={pagination}
        loading={loading}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        onPageChange={fetchPayments}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-1">
      <div className="text-[10px] uppercase tracking-wider text-muted/60">
        {label}
      </div>
      <div className="text-lg font-medium font-mono">{value}</div>
    </div>
  );
}
