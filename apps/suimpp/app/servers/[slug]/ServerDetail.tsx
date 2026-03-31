'use client';

import { useState } from 'react';
import { CopyBlock } from '../../components/CopyBlock';

interface EndpointInfo {
  path: string;
  method: string;
  summary: string | null;
  price: string | null;
  pricingMode: string;
}

interface ServerInfo {
  id: number;
  name: string;
  slug: string;
  url: string;
  description: string | null;
  endpoints: number;
  categories: string;
  services: number;
  endpointData: string;
  createdAt: string;
}

interface Stats {
  txns: number;
  volume: number;
  agents: number;
}

interface TimelinePoint {
  date: string;
  volume: number;
}

interface Payment {
  id: number;
  digest: string | null;
  sender: string | null;
  amount: string;
  network: string;
  endpoint: string;
  createdAt: string;
}

interface ServerDetailProps {
  server: ServerInfo;
  stats: Stats;
  volumeTimeline: TimelinePoint[];
  txnsByEndpoint: Record<string, number>;
  recentPayments: Payment[];
}

interface ServiceGroup {
  name: string;
  endpoints: EndpointInfo[];
  txns: number;
}

function truncate(s: string, start = 6, end = 4) {
  if (s.length <= start + end + 3) return s;
  return `${s.slice(0, start)}...${s.slice(-end)}`;
}

function suiscanUrl(digest: string, network: string) {
  return `https://suiscan.xyz/${network}/tx/${digest}`;
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

function priceRange(endpoints: EndpointInfo[]): string {
  const prices = endpoints
    .map((ep) => parseFloat(ep.price ?? ''))
    .filter((p) => !isNaN(p));
  if (prices.length === 0) return 'dynamic';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return `$${min}`;
  return `$${min}–$${max}`;
}

function groupByService(
  endpoints: EndpointInfo[],
  txnsByEndpoint: Record<string, number>,
): ServiceGroup[] {
  const groups: Record<string, EndpointInfo[]> = {};
  for (const ep of endpoints) {
    const service = ep.path.split('/')[1] || 'other';
    if (!groups[service]) groups[service] = [];
    groups[service].push(ep);
  }
  return Object.entries(groups)
    .map(([name, eps]) => ({
      name,
      endpoints: eps,
      txns: eps.reduce((sum, ep) => sum + (txnsByEndpoint[ep.path] ?? 0), 0),
    }))
    .sort((a, b) => b.txns - a.txns || a.name.localeCompare(b.name));
}

export function ServerDetail({
  server,
  stats,
  volumeTimeline,
  txnsByEndpoint,
  recentPayments,
}: ServerDetailProps) {
  const registeredDate = new Date(server.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  const parsedEndpoints: EndpointInfo[] = (() => {
    try {
      return JSON.parse(server.endpointData);
    } catch {
      return [];
    }
  })();

  const serviceGroups = groupByService(parsedEndpoints, txnsByEndpoint);
  const serverHost = server.url.replace('https://', '');

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <h1 className="text-2xl font-medium">{server.name}</h1>
        {server.description && (
          <p className="text-sm text-muted max-w-2xl">{server.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <a
            href={server.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            {serverHost} ↗
          </a>
          {server.services > 0 && (
            <span>{server.services} services, {server.endpoints} endpoints</span>
          )}
          {server.services === 0 && <span>{server.endpoints} endpoints</span>}
          <span>Registered {registeredDate}</span>
        </div>
        {server.categories && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {server.categories.split(', ').filter(Boolean).map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-border text-muted border border-border"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Try / Use this server */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
          <div className="text-xs font-medium text-text">Try an endpoint</div>
          <CopyBlock code={`npx @suimpp/discovery check ${serverHost}`} />
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
          <div className="text-xs font-medium text-text">Use in your agent</div>
          <CopyBlock code={`mpp.fetch("${server.url}/openai/v1/chat/completions", {\n  method: "POST",\n  body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: "Hello" }] })\n})`} />
        </div>
      </div>

      {/* Stats + Volume side-by-side on desktop */}
      <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          <StatCard label="Transactions" value={stats.txns.toLocaleString()} />
          <StatCard label="Volume" value={`$${stats.volume.toLocaleString()}`} />
          <StatCard label="Agents" value={String(stats.agents)} />
          <StatCard
            label="Latest"
            value={
              recentPayments.length > 0
                ? timeAgo(recentPayments[0].createdAt)
                : '—'
            }
          />
        </div>

        {volumeTimeline.length > 0 && (
          <div className="rounded-lg border border-border bg-surface p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium">Volume</h3>
              <span className="text-[10px] font-mono text-muted">
                {volumeTimeline.length} {volumeTimeline.length === 1 ? 'day' : 'days'}
              </span>
            </div>
            <div className="h-36 flex items-end gap-[2px]">
              {(() => {
                const maxVol = Math.max(...volumeTimeline.map((d) => d.volume), 0.01);
                return volumeTimeline.map((d, i) => {
                  const height = Math.max((d.volume / maxVol) * 100, 2);
                  return (
                    <div
                      key={i}
                      className="flex-1 group relative flex flex-col items-center justify-end"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-bg border border-border text-[10px] font-mono text-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        ${d.volume.toFixed(2)}
                        <div className="text-muted">
                          {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                      <div
                        className="w-full rounded-t bg-accent/60 hover:bg-accent transition-colors cursor-default"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  );
                });
              })()}
            </div>
            {volumeTimeline.length > 1 && (
              <div className="flex justify-between mt-2 text-[10px] font-mono text-muted/50">
                <span>
                  {new Date(volumeTimeline[0].date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span>
                  {new Date(
                    volumeTimeline[volumeTimeline.length - 1].date + 'T00:00:00',
                  ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Endpoints grouped by service */}
      {serviceGroups.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Endpoints</h3>
            <span className="text-[11px] font-mono text-muted">
              {parsedEndpoints.length} total across {serviceGroups.length} services
            </span>
          </div>
          {serviceGroups.map((group) => (
            <ServiceGroupCard
              key={group.name}
              group={group}
              txnsByEndpoint={txnsByEndpoint}
            />
          ))}
        </div>
      )}

      {/* Recent Payments */}
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium">Recent Payments</h3>
          <span className="text-[11px] font-mono text-muted">
            {stats.txns.toLocaleString()} total
          </span>
        </div>
        {recentPayments.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted">
            No payments yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-4 py-2 font-medium text-muted/60 text-[10px] uppercase tracking-wider">
                    Time
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-muted/60 text-[10px] uppercase tracking-wider hidden sm:table-cell">
                    Endpoint
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-muted/60 text-[10px] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-muted/60 text-[10px] uppercase tracking-wider">
                    Tx
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {recentPayments.map((p) => (
                  <tr key={p.id} className="group hover:bg-border/5 transition-colors">
                    <td className="px-4 py-2 font-mono text-muted whitespace-nowrap">
                      {timeAgo(p.createdAt)}
                    </td>
                    <td className="px-4 py-2 font-mono text-muted truncate max-w-48 hidden sm:table-cell">
                      {p.endpoint || '—'}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-text whitespace-nowrap">
                      {formatUSDC(p.amount)}
                    </td>
                    <td className="px-4 py-2 font-mono">
                      {p.digest ? (
                        <a
                          href={suiscanUrl(p.digest, p.network)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted hover:text-accent transition-colors"
                          title={p.digest}
                        >
                          {truncate(p.digest, 6, 4)}
                          <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            ↗
                          </span>
                        </a>
                      ) : (
                        <span className="text-muted/40">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceGroupCard({
  group,
  txnsByEndpoint,
}: {
  group: ServiceGroup;
  txnsByEndpoint: Record<string, number>;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-border/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-text capitalize">{group.name}</span>
          <span className="text-[10px] font-mono text-muted">
            {group.endpoints.length} endpoint{group.endpoints.length !== 1 ? 's' : ''}
          </span>
          {group.txns > 0 && (
            <span className="text-[10px] font-mono text-muted">
              {group.txns} txn{group.txns !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-muted">
            {priceRange(group.endpoints)}
          </span>
          <span className="text-muted text-xs">{open ? '▾' : '▸'}</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-border/50">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-border/30">
              {group.endpoints.map((ep, i) => (
                <tr key={i} className="group/row hover:bg-border/5 transition-colors">
                  <td className="px-4 py-2 font-mono text-muted">
                    <CopyableText text={ep.path} />
                  </td>
                  <td className="px-4 py-2 font-mono text-muted/60 hidden sm:table-cell w-16">
                    {ep.method}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-text whitespace-nowrap w-24">
                    {ep.price ? `$${ep.price}` : 'dynamic'}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-muted w-16">
                    {txnsByEndpoint[ep.path] ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CopyableText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="text-left font-mono text-muted hover:text-text transition-colors cursor-pointer"
      title="Click to copy"
    >
      {text}
      <span className="ml-1.5 text-[10px] text-muted/40 opacity-0 group-hover/row:opacity-100 transition-opacity">
        {copied ? '✓' : '⎘'}
      </span>
    </button>
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
