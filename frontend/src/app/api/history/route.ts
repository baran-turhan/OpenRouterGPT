import { NextResponse } from 'next/server';
import { backendFetch } from '@/server/backendFetch';
import { withApiTracing } from '@/server/withApiTracing';

export const dynamic = 'force-dynamic';

export const GET = withApiTracing('frontend.history', async (req, span) => {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }
  span.setAttribute('history.session_id', sessionId);
  const { data, status } = await backendFetch(`/api/history?sessionId=${encodeURIComponent(sessionId)}`, {
    method: 'GET',
    spanName: 'backend.history',
    span
  });
  return NextResponse.json(data, { status });
});
