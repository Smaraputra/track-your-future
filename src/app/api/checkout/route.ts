import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { auth } from '@/auth';
import { getBillingProvider } from '@/lib/billing/provider';
import { db } from '@/db';
import { subscriptions } from '@/db/schema/billing';
import { users } from '@/db/schema/auth';

const checkoutSchema = z.object({
  interval: z.enum(['monthly', 'annual']),
});

export async function POST(request: Request) {
  const provider = await getBillingProvider();
  if (!provider) {
    return NextResponse.json(
      { error: 'Billing not configured' },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Check for existing active subscription
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, session.user.id),
    columns: { status: true, providerCustomerId: true },
  });

  if (
    existing &&
    ['active', 'trialing'].includes(existing.status)
  ) {
    return NextResponse.json(
      { error: 'You already have an active subscription' },
      { status: 409 },
    );
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { email: true, name: true },
  });

  const result = await provider.createCheckout({
    userId: session.user.id,
    email: user?.email ?? null,
    name: user?.name ?? null,
    interval: parsed.data.interval,
    existingCustomerId: existing?.providerCustomerId ?? null,
  });

  return NextResponse.json({ url: result.url });
}
