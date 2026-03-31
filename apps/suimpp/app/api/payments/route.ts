import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') ?? '10', 10),
    50,
  );

  const payments = await db.payment.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { server: { select: { name: true } } },
  });

  return NextResponse.json(payments);
}
