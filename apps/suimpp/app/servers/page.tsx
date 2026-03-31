import { db } from '@/lib/db';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Servers — suimpp',
  description: 'MPP servers accepting Sui USDC payments. Browse registered servers and their endpoints.',
};

export default async function ServersPage() {
  const servers = await db.server.findMany({
    where: { verified: true },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { payments: true } },
    },
  });

  const totalEndpoints = servers.reduce((sum, s) => sum + s.endpoints, 0);
  const totalPayments = servers.reduce((sum, s) => sum + s._count.payments, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-3">
            <h1 className="text-2xl font-medium">MPP Servers on Sui</h1>
            <p className="text-sm text-muted">
              {servers.length} {servers.length === 1 ? 'server' : 'servers'} ·{' '}
              {totalEndpoints} endpoints ·{' '}
              {totalPayments.toLocaleString()} total payments
            </p>
          </div>

          <div className="space-y-4">
            {servers.map((server) => (
              <div
                key={server.id}
                className="rounded-lg border border-border bg-surface p-5 space-y-3 hover:border-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="font-medium">{server.name}</h2>
                    <p className="text-xs text-muted">
                      {server.services} services · {server.endpoints} endpoints
                    </p>
                  </div>
                  <a
                    href={server.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:text-accent-hover transition-colors shrink-0"
                  >
                    {server.url.replace('https://', '')} ↗
                  </a>
                </div>

                <div className="flex gap-6 font-mono text-xs text-muted">
                  <span>
                    <span className="text-text">
                      {server._count.payments.toLocaleString()}
                    </span>{' '}
                    txns
                  </span>
                  <span>
                    Registered{' '}
                    {server.createdAt.toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Register CTA */}
          <div className="rounded-lg border border-border bg-surface/50 p-6 text-center space-y-3">
            <h3 className="font-medium">Run an MPP server?</h3>
            <p className="text-sm text-muted max-w-md mx-auto">
              Register your server to be discoverable on Sui. We&apos;ll validate
              your OpenAPI spec and start tracking payments automatically.
            </p>
            <a
              href="https://github.com/mission69b/mppsui/issues/new?title=Register+server&template=register-server.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm px-4 py-2 rounded-md border border-accent text-accent hover:bg-accent hover:text-bg transition-colors"
            >
              Register your server
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
