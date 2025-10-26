import { context, Span, SpanStatusCode, trace } from '@opentelemetry/api';
import { NextRequest, NextResponse } from 'next/server';
import { BackendHttpError } from './errors';
import { initFrontendTelemetry } from './telemetry';

initFrontendTelemetry();

const tracer = trace.getTracer('madlen-frontend');

type Handler = (req: NextRequest, span: Span) => Promise<NextResponse>;

export const withApiTracing = (name: string, handler: Handler) => {
  return async (req: NextRequest): Promise<NextResponse> => {
    const span = tracer.startSpan(name);
    return await context.with(trace.setSpan(context.active(), span), async () => {
      try {
        const response = await handler(req, span);
        span.setStatus({ code: SpanStatusCode.OK });
        return response;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        span.recordException(error as Error);
        if (error instanceof BackendHttpError) {
          span.setStatus({ code: SpanStatusCode.ERROR, message });
          return NextResponse.json({ error: message }, { status: error.status });
        }
        span.setStatus({ code: SpanStatusCode.ERROR, message });
        return NextResponse.json({ error: message }, { status: 500 });
      } finally {
        span.end();
      }
    });
  };
};
