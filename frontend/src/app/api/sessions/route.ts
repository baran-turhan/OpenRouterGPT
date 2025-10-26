import { NextResponse } from 'next/server';
import { backendFetch } from '@/server/backendFetch';
import { withApiTracing } from '@/server/withApiTracing';

export const dynamic = 'force-dynamic';

export const GET = withApiTracing('frontend.sessions', async (_req, span) => {
  const { data } = await backendFetch('/api/sessions', {
    method: 'GET',
    spanName: 'backend.sessions',
    span,
  });
  span.setAttribute('sessions.count', Array.isArray(data) ? data.length : 0);
  return NextResponse.json(data);
});
