import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/server/backendFetch';
import { serverConfig } from '@/server/config';
import { withApiTracing } from '@/server/withApiTracing';

export const dynamic = 'force-dynamic';

export const POST = withApiTracing('frontend.upload', async (req: NextRequest, span) => {
  const formData = await req.formData();
  const { data, status } = await backendFetch<{ url: string }>('/api/upload', {
    method: 'POST',
    body: formData as unknown as BodyInit,
    spanName: 'backend.upload',
    span,
    duplex: 'half'
  });
  span.setAttribute('upload.bytes', (formData.get('file') as File | null)?.size ?? 0);
  const url = data?.url?.startsWith('http') ? data.url : `${serverConfig.backendBaseUrl}${data?.url ?? ''}`;
  return NextResponse.json({ url }, { status });
});
