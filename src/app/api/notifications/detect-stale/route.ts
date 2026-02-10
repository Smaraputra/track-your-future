import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { detectStaleApps } from '@/lib/notifications/stale-detection';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const created = await detectStaleApps(session.user.id);

  return NextResponse.json({ created });
}
