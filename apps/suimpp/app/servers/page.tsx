import { db } from '@/lib/db';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { ServerList } from './ServerList';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 15;

export const metadata: Metadata = {
  title: 'Servers — suimpp',
  description:
    'MPP servers accepting Sui USDC payments. Browse registered servers and their endpoints.',
};

export default async function ServersPage() {
  const servers = await db.server.findMany({
    where: { verified: true, status: 'active' },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { payments: true } },
      payments: {
        select: { amount: true, sender: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  const totalEndpoints = servers.reduce((sum, s) => sum + s.endpoints, 0);
  const totalPayments = servers.reduce((sum, s) => sum + s._count.payments, 0);

  const allCategories = new Set<string>();
  const enriched = servers.map((server) => {
    const volume = server.payments.reduce(
      (sum, p) => sum + parseFloat(p.amount || '0'),
      0,
    );
    const agents = new Set(
      server.payments.filter((p) => p.sender).map((p) => p.sender),
    ).size;
    const lastPayment =
      server.payments.length > 0
        ? server.payments[server.payments.length - 1].createdAt.toISOString()
        : null;

    const volumeByDay: Record<string, number> = {};
    for (const p of server.payments) {
      const day = p.createdAt.toISOString().slice(0, 10);
      volumeByDay[day] = (volumeByDay[day] ?? 0) + parseFloat(p.amount || '0');
    }
    const last30 = Object.keys(volumeByDay).sort().slice(-30);
    const sparkline = last30.map((d) => volumeByDay[d]);

    const cats = server.categories.split(', ').filter(Boolean);
    cats.forEach((c) => allCategories.add(c));

    return {
      id: server.id,
      name: server.name,
      slug: server.slug,
      services: server.services,
      endpoints: server.endpoints,
      categories: server.categories,
      txns: server._count.payments,
      volume: Math.round(volume * 100) / 100,
      agents,
      lastPayment,
      sparkline,
    };
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <ServerList
            servers={enriched}
            totalEndpoints={totalEndpoints}
            totalPayments={totalPayments}
            categories={Array.from(allCategories).sort()}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
