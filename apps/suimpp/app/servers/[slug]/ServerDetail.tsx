'use client';

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
            {server.url.replace('https://', '')} ↗
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

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

      {/* Volume Chart */}
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

      {/* Endpoints Table */}
      {parsedEndpoints.length > 0 && (
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium">Endpoints</h3>
            <span className="text-[11px] font-mono text-muted">
              {parsedEndpoints.length} total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-4 py-2 font-medium text-muted/60 text-[10px] uppercase tracking-wider">
                    Endpoint
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-muted/60 text-[10px] uppercase tracking-wider hidden sm:table-cell">
                    Method
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-muted/60 text-[10px] uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-muted/60 text-[10px] uppercase tracking-wider">
                    Txns
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {parsedEndpoints.map((ep, i) => (
                  <tr key={i} className="hover:bg-border/5 transition-colors">
                    <td className="px-4 py-2 font-mono text-muted">
                      {ep.path}
                    </td>
                    <td className="px-4 py-2 font-mono text-muted/60 hidden sm:table-cell">
                      {ep.method}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-text whitespace-nowrap">
                      {ep.price ? `$${ep.price}` : 'dynamic'}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-muted">
                      {txnsByEndpoint[ep.path] ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
