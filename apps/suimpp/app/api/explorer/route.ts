import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10));
  const limit = Math.min(Math.max(1, parseInt(params.get('limit') ?? '25', 10)), 100);
  const serverId = params.get('server') ? parseInt(params.get('server')!, 10) : null;
  const sort = params.get('sort') === 'amount' ? 'amount' : 'createdAt';
  const order = params.get('order') === 'asc' ? 'asc' : 'desc';

  const where: Prisma.PaymentWhereInput = {};
  if (serverId) where.serverId = serverId;

  const [payments, total] = await Promise.all([
    db.payment.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: sort === 'amount' ? { amount: order } : { createdAt: order },
      include: { server: { select: { name: true, url: true } } },
    }),
    db.payment.count({ where }),
  ]);

  return NextResponse.json({
    payments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}
