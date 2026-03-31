'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface ServerCard {
  id: number;
  name: string;
  slug: string;
  services: number;
  endpoints: number;
  categories: string;
  txns: number;
  volume: number;
  agents: number;
  lastPayment: string | null;
  sparkline: number[];
}

type SortOption = 'txns' | 'volume' | 'endpoints' | 'newest';

interface ServerListProps {
  servers: ServerCard[];
  totalEndpoints: number;
  totalPayments: number;
  categories: string[];
}

export function ServerList({
  servers,
  totalEndpoints,
  totalPayments,
  categories,
}: ServerListProps) {
  const [sort, setSort] = useState<SortOption>('txns');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filtered = useMemo(() => {
    let list = servers;
    if (categoryFilter) {
      list = list.filter((s) =>
        s.categories
          .split(', ')
          .some((c) => c === categoryFilter),
      );
    }

    const sorted = [...list];
    switch (sort) {
      case 'txns':
        sorted.sort((a, b) => b.txns - a.txns);
        break;
      case 'volume':
        sorted.sort((a, b) => b.volume - a.volume);
        break;
      case 'endpoints':
        sorted.sort((a, b) => b.endpoints - a.endpoints);
        break;
      case 'newest':
        sorted.sort((a, b) => {
          if (!a.lastPayment) return 1;
          if (!b.lastPayment) return -1;
          return new Date(b.lastPayment).getTime() - new Date(a.lastPayment).getTime();
        });
        break;
    }
    return sorted;
  }, [servers, sort, categoryFilter]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <h1 className="text-2xl font-medium">MPP Servers on Sui</h1>
          <p className="text-sm text-muted">
            {servers.length}{' '}
            {servers.length === 1 ? 'server' : 'servers'} ·{' '}
            {totalEndpoints} endpoints ·{' '}
            {totalPayments.toLocaleString()} total payments
          </p>
        </div>
        <Link
          href="/register"
          className="shrink-0 text-sm px-4 py-2 rounded-md border border-accent text-accent hover:bg-accent hover:text-bg transition-colors"
        >
          Register yours →
        </Link>
      </div>

      {/* Sort + Filter Controls */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="bg-surface border border-border rounded px-2 py-1 text-xs text-text cursor-pointer focus:outline-none focus:border-accent/50"
          >
            <option value="txns">Most txns</option>
            <option value="volume">Highest volume</option>
            <option value="endpoints">Most endpoints</option>
            <option value="newest">Most recent</option>
          </select>
        </div>
        {categories.length > 1 && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Filter:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-surface border border-border rounded px-2 py-1 text-xs text-text cursor-pointer focus:outline-none focus:border-accent/50"
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Server Cards */}
      <div className="space-y-4">
        {filtered.map((server) => (
          <Link
            key={server.id}
            href={`/servers/${server.slug}`}
            className="block rounded-lg border border-border bg-surface p-5 space-y-3 hover:border-accent/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <h2 className="font-medium">{server.name}</h2>
                <p className="text-xs text-muted">
                  {server.services > 0 && `${server.services} services · `}
                  {server.endpoints} endpoints
                </p>
                {server.categories && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {server.categories
                      .split(', ')
                      .filter(Boolean)
                      .map((cat) => (
                        <span
                          key={cat}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-border text-muted"
                        >
                          {cat}
                        </span>
                      ))}
                  </div>
                )}
              </div>
              <span className="text-xs text-muted shrink-0">View →</span>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-muted">
              <span>
                Txns: <span className="text-text">{server.txns.toLocaleString()}</span>
              </span>
              <span>
                Vol: <span className="text-text">${server.volume.toLocaleString()}</span>
              </span>
              <span>
                Agents: <span className="text-text">{server.agents}</span>
              </span>
              {server.lastPayment && (
                <span>{timeAgo(server.lastPayment)}</span>
              )}
            </div>

            {server.sparkline.length > 1 && (
              <Sparkline data={server.sparkline} />
            )}
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg border border-border bg-surface/50 p-6 text-center space-y-3">
          {categoryFilter ? (
            <>
              <h3 className="font-medium">No servers in this category</h3>
              <button
                onClick={() => setCategoryFilter('')}
                className="text-sm text-accent hover:underline cursor-pointer"
              >
                Clear filter
              </button>
            </>
          ) : (
            <>
              <h3 className="font-medium">No servers registered yet</h3>
              <p className="text-sm text-muted max-w-md mx-auto">
                Be the first to register your MPP server on Sui.
              </p>
              <Link
                href="/register"
                className="inline-block text-sm px-4 py-2 rounded-md border border-accent text-accent hover:bg-accent hover:text-bg transition-colors"
              >
                Register your server →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 0.01);
  return (
    <div className="flex items-end gap-px h-5">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-muted/30 min-w-[2px]"
          style={{ height: `${Math.max((v / max) * 100, 8)}%` }}
        />
      ))}
    </div>
  );
}
