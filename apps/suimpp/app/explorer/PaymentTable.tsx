'use client';

import type { SortField, SortOrder } from './ExplorerContent';

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

interface PaymentTableProps {
  payments: Payment[];
  pagination: Pagination;
  loading: boolean;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onPageChange: (page: number) => void;
}

function truncate(s: string, start = 6, end = 4) {
  if (s.length <= start + end + 3) return s;
  return `${s.slice(0, start)}...${s.slice(-end)}`;
}

function suiscanUrl(digest: string, network: string) {
  return `https://suiscan.xyz/${network}/tx/${digest}`;
}

function suiscanAddr(addr: string, network: string) {
  return `https://suiscan.xyz/${network}/account/${addr}`;
}

function formatUSDC(amount: string) {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  if (num < 0.01) return `$${num.toFixed(6)}`;
  return `$${num.toFixed(4)}`;
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SortIcon({ field, active, order }: { field: string; active: boolean; order: SortOrder }) {
  if (!active) return <span className="text-muted/30 ml-1">↕</span>;
  return <span className="text-accent ml-1">{order === 'desc' ? '↓' : '↑'}</span>;
}

export function PaymentTable({
  payments,
  pagination,
  loading,
  sortField,
  sortOrder,
  onSort,
  onPageChange,
}: PaymentTableProps) {
  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium">Transactions</span>
        <span className="text-[11px] font-mono text-muted">
          {pagination.total.toLocaleString()} total
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left px-4 py-2.5 font-medium text-muted/60 text-[10px] uppercase tracking-wider">
                Server
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-muted/60 text-[10px] uppercase tracking-wider">
                Transaction
              </th>
              <th className="text-left px-4 py-2.5 font-medium text-muted/60 text-[10px] uppercase tracking-wider hidden md:table-cell">
                From
              </th>
              <th
                className="text-right px-4 py-2.5 font-medium text-muted/60 text-[10px] uppercase tracking-wider cursor-pointer hover:text-muted select-none"
                onClick={() => onSort('amount')}
              >
                Amount
                <SortIcon field="amount" active={sortField === 'amount'} order={sortOrder} />
              </th>
              <th
                className="text-right px-4 py-2.5 font-medium text-muted/60 text-[10px] uppercase tracking-wider cursor-pointer hover:text-muted select-none"
                onClick={() => onSort('createdAt')}
              >
                Time
                <SortIcon field="createdAt" active={sortField === 'createdAt'} order={sortOrder} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {loading && payments.length === 0 ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-4 bg-border/30 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted">
                  No payments found
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr
                  key={p.id}
                  className="group hover:bg-border/5 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <span className="text-text font-medium">
                      {p.server.name}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono">
                    {p.digest ? (
                      <a
                        href={suiscanUrl(p.digest, p.network)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted hover:text-accent transition-colors"
                        title={p.digest}
                      >
                        {truncate(p.digest, 8, 6)}
                        <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          ↗
                        </span>
                      </a>
                    ) : (
                      <span className="text-muted/40">pending</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono hidden md:table-cell">
                    {p.sender ? (
                      <a
                        href={suiscanAddr(p.sender, p.network)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted hover:text-accent transition-colors"
                        title={p.sender}
                      >
                        {truncate(p.sender)}
                      </a>
                    ) : (
                      <span className="text-muted/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-text whitespace-nowrap">
                    {formatUSDC(p.amount)}
                  </td>
                  <td
                    className="px-4 py-2.5 text-right font-mono text-muted whitespace-nowrap"
                    title={formatDate(p.createdAt)}
                  >
                    {timeAgo(p.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-[11px] text-muted font-mono">
            Page {pagination.page} of {pagination.pages}
          </span>
          <div className="flex gap-1">
            <PageButton
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              ← Prev
            </PageButton>
            <PageButton
              disabled={pagination.page >= pagination.pages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next →
            </PageButton>
          </div>
        </div>
      )}
    </div>
  );
}

function PageButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1 rounded text-[11px] font-mono border border-border text-muted hover:text-text hover:border-accent/40 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}
