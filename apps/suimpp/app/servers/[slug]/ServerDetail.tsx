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

  const serverHost = server.url.replace('https://', '');

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <h1 className="text-2xl font-medium">{server.name}</h1>
        {server.description && (
          <p className="text-sm text-muted max-w-2xl line-clamp-2">{server.description}</p>
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
          <span className="text-border">·</span>
          <span>{server.endpoints} endpoints</span>
          <span className="text-border">·</span>
          <span>{stats.txns} txns</span>
          {stats.volume > 0 && (
            <>
              <span className="text-border">·</span>
              <span>${stats.volume.toLocaleString()}</span>
            </>
          )}
          {stats.agents > 0 && (
            <>
              <span className="text-border">·</span>
              <span>{stats.agents} agent{stats.agents !== 1 ? 's' : ''}</span>
            </>
          )}
          {recentPayments.length > 0 && (
            <>
              <span className="text-border">·</span>
              <span>{timeAgo(recentPayments[0].createdAt)}</span>
            </>
          )}
          <span className="text-border">·</span>
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

      {/* Validate / Use this server */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
          <div className="text-xs font-medium text-text">Validate</div>
          <CopyBlock code={`npx @suimpp/discovery check ${serverHost}`} />
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
          <div className="text-xs font-medium text-text">Use with t2000</div>
          <CopyBlock code={`t2000 pay "${server.url}/openai/v1/chat/completions" \\\n  --data '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello"}]}' \\\n  --max-price 0.05`} />
          <a href="/agent" className="inline-block text-[11px] text-muted hover:text-text transition-colors">
            Setup guide →
          </a>
        </div>
      </div>

      {/* Endpoints */}
      {parsedEndpoints.length > 0 && (
        <EndpointsTable
          endpoints={parsedEndpoints}
          txnsByEndpoint={txnsByEndpoint}
          serverUrl={server.url}
        />
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

function EndpointsTable({
  endpoints,
  txnsByEndpoint,
  serverUrl,
}: {
  endpoints: EndpointInfo[];
  txnsByEndpoint: Record<string, number>;
  serverUrl: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium">Endpoints</h3>
        <span className="text-[11px] font-mono text-muted">
          {endpoints.length} total
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left px-4 py-2 font-medium text-muted/60 text-[10px] uppercase tracking-wider">
                Endpoint
              </th>
              <th className="text-right px-4 py-2 font-medium text-muted/60 text-[10px] uppercase tracking-wider w-24">
                Price
              </th>
              <th className="text-right px-4 py-2 font-medium text-muted/60 text-[10px] uppercase tracking-wider w-16">
                Txns
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {endpoints.map((ep, i) => (
              <tr key={i} className="group/row hover:bg-border/5 transition-colors">
                <td className="px-4 py-2 font-mono text-muted">
                  <CopyableText text={ep.path} copyValue={`${serverUrl}${ep.path}`} />
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
    </div>
  );
}

function CopyableText({ text, copyValue }: { text: string; copyValue?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(copyValue ?? text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="text-left font-mono text-muted hover:text-text transition-colors cursor-pointer"
      title={`Copy ${copyValue ?? text}`}
    >
      {text}
      <span className="ml-1.5 text-[10px] text-muted/40 opacity-0 group-hover/row:opacity-100 transition-opacity">
        {copied ? '✓' : '⎘'}
      </span>
    </button>
  );
}

