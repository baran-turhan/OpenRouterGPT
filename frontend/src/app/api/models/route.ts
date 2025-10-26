import { NextResponse } from 'next/server';
import { backendFetch } from '@/server/backendFetch';
import { withApiTracing } from '@/server/withApiTracing';

export const dynamic = 'force-dynamic';

export const GET = withApiTracing('frontend.models', async (_req, span) => {
  const { data } = await backendFetch('/api/models', {
    method: 'GET',
    spanName: 'backend.models',
    span
  });
  span.setAttribute('models.count', Array.isArray(data) ? data.length : 0);
  return NextResponse.json(data);
});
