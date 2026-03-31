import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [payments, servers] = await Promise.all([
    db.payment.findMany({
      select: { amount: true, createdAt: true, serverId: true },
      orderBy: { createdAt: 'asc' },
    }),
    db.server.findMany({
      where: { verified: true },
      select: { id: true, name: true },
    }),
  ]);

  const totalVolume = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount || '0'),
    0,
  );

  const serverMap = new Map(servers.map((s) => [s.id, s.name]));

  const byServerRaw: Record<number, { count: number; volume: number }> = {};
  for (const p of payments) {
    if (!byServerRaw[p.serverId]) byServerRaw[p.serverId] = { count: 0, volume: 0 };
    byServerRaw[p.serverId].count++;
    byServerRaw[p.serverId].volume += parseFloat(p.amount || '0');
  }

  const volumeByDay: Record<string, number> = {};
  for (const p of payments) {
    const day = p.createdAt.toISOString().slice(0, 10);
    volumeByDay[day] = (volumeByDay[day] ?? 0) + parseFloat(p.amount || '0');
  }

  const sortedDays = Object.keys(volumeByDay).sort();
  const volumeTimeline = sortedDays.map((day) => ({
    date: day,
    volume: Math.round(volumeByDay[day] * 100) / 100,
  }));

  return NextResponse.json({
    totalPayments: payments.length,
    totalVolume: Math.round(totalVolume * 100) / 100,
    serverCount: servers.length,
    byServer: Object.entries(byServerRaw)
      .map(([id, data]) => ({
        id: parseInt(id, 10),
        name: serverMap.get(parseInt(id, 10)) ?? `Server #${id}`,
        count: data.count,
        volume: Math.round(data.volume * 100) / 100,
      }))
      .sort((a, b) => b.volume - a.volume),
    volumeTimeline,
  });
}
