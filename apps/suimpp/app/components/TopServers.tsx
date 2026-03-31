import Link from 'next/link';
import { db } from '@/lib/db';

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export async function TopServers() {
  const servers = await db.server.findMany({
    where: { verified: true, status: 'active' },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { payments: true } },
      payments: {
        select: { amount: true, sender: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      },
    },
  });

  if (servers.length === 0) return null;

  const enriched = servers
    .map((server) => {
      const volume = server.payments.reduce(
        (sum, p) => sum + parseFloat(p.amount || '0'),
        0,
      );
      const agents = new Set(
        server.payments.filter((p) => p.sender).map((p) => p.sender),
      ).size;
      const latest = server.payments[0]?.createdAt ?? null;

      return {
        name: server.name,
        slug: server.slug,
        endpoints: server.endpoints,
        txns: server._count.payments,
        volume: Math.round(volume * 100) / 100,
        agents,
        latest,
      };
    })
    .sort((a, b) => b.txns - a.txns)
    .slice(0, 5);

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium">Top Servers</span>
        <Link
          href="/servers"
          className="text-xs text-muted hover:text-text transition-colors"
        >
          All →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left px-4 py-2 font-medium text-muted/60 text-[10px] uppercase tracking-wider">
                Server
              </th>
              <th className="text-right px-4 py-2 font-medium text-muted/60 text-[10px] uppercase tracking-wider">
                Txns
              </th>
              <th className="text-right px-4 py-2 font-medium text-muted/60 text-[10px] uppercase tracking-wider hidden sm:table-cell">
                Volume
              </th>
              <th className="text-right px-4 py-2 font-medium text-muted/60 text-[10px] uppercase tracking-wider hidden sm:table-cell">
                Agents
              </th>
              <th className="text-right px-4 py-2 font-medium text-muted/60 text-[10px] uppercase tracking-wider">
                Latest
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {enriched.map((s) => (
              <tr key={s.slug} className="hover:bg-border/5 transition-colors">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/servers/${s.slug}`}
                    className="text-text font-medium hover:text-accent transition-colors"
                  >
                    {s.name}
                  </Link>
                  <span className="text-muted/60 ml-2 hidden md:inline">
                    {s.endpoints} endpoints
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-muted">
                  {s.txns.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-muted hidden sm:table-cell">
                  ${s.volume.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-muted hidden sm:table-cell">
                  {s.agents}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-muted whitespace-nowrap">
                  {s.latest ? timeAgo(s.latest) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
