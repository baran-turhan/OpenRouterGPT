import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/server/backendFetch';
import { withApiTracing } from '@/server/withApiTracing';

export const dynamic = 'force-dynamic';

export const POST = withApiTracing('frontend.chat', async (req: NextRequest, span) => {
  const body = await req.json();
  span.setAttributes({
    'chat.model': body?.model ?? 'missing',
    'chat.session_id': body?.sessionId ?? 'new'
  });
  const { data, status } = await backendFetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    spanName: 'backend.chat',
    span
  });
  return NextResponse.json(data, { status });
});
