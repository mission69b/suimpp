import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { Nav } from '../../components/Nav';
import { Footer } from '../../components/Footer';
import { ServerDetail } from './ServerDetail';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 15;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const server = await db.server.findUnique({ where: { slug } });
  if (!server) return { title: 'Not Found — suimpp' };
  return {
    title: `${server.name} — suimpp`,
    description: server.description ?? `${server.name} — MPP server on Sui with ${server.endpoints} endpoints.`,
  };
}

export default async function ServerPage({ params }: Props) {
  const { slug } = await params;
  const server = await db.server.findUnique({
    where: { slug },
    include: {
      _count: { select: { payments: true } },
    },
  });

  if (!server) notFound();

  const payments = await db.payment.findMany({
    where: { serverId: server.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const allPayments = await db.payment.findMany({
    where: { serverId: server.id },
    select: { amount: true, sender: true, createdAt: true, endpoint: true },
    orderBy: { createdAt: 'asc' },
  });

  const volume = allPayments.reduce(
    (sum, p) => sum + parseFloat(p.amount || '0'),
    0,
  );

  const uniqueAgents = new Set(
    allPayments.filter((p) => p.sender).map((p) => p.sender),
  ).size;

  const volumeByDay: Record<string, number> = {};
  for (const p of allPayments) {
    const day = p.createdAt.toISOString().slice(0, 10);
    volumeByDay[day] = (volumeByDay[day] ?? 0) + parseFloat(p.amount || '0');
  }
  const volumeTimeline = Object.keys(volumeByDay)
    .sort()
    .map((day) => ({
      date: day,
      volume: Math.round(volumeByDay[day] * 100) / 100,
    }));

  const txnsByEndpoint: Record<string, number> = {};
  for (const p of allPayments) {
    if (p.endpoint) {
      txnsByEndpoint[p.endpoint] = (txnsByEndpoint[p.endpoint] ?? 0) + 1;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <ServerDetail
            server={{
              id: server.id,
              name: server.name,
              slug: server.slug,
              url: server.url,
              description: server.description,
              endpoints: server.endpoints,
              categories: server.categories,
              services: server.services,
              endpointData: server.endpointData,
              createdAt: server.createdAt.toISOString(),
            }}
            stats={{
              txns: server._count.payments,
              volume: Math.round(volume * 100) / 100,
              agents: uniqueAgents,
            }}
            volumeTimeline={volumeTimeline}
            txnsByEndpoint={txnsByEndpoint}
            recentPayments={payments.map((p) => ({
              id: p.id,
              digest: p.digest,
              sender: p.sender,
              amount: p.amount,
              network: p.network,
              endpoint: p.endpoint,
              createdAt: p.createdAt.toISOString(),
            }))}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
