import { context, Span, SpanStatusCode, trace } from '@opentelemetry/api';
import { serverConfig } from './config';
import { BackendHttpError } from './errors';

const tracer = trace.getTracer('madlen-frontend');

export interface BackendFetchOptions extends RequestInit {
  spanName?: string;
  span?: Span;
  duplex?: 'half';
}

interface BackendResponse<T> {
  data: T;
  status: number;
}

const buildUrl = (path: string): string => {
  if (path.startsWith('http')) {
    return path;
  }
  return `${serverConfig.backendBaseUrl}${path}`;
};

export async function backendFetch<T>(path: string, options: BackendFetchOptions = {}): Promise<BackendResponse<T>> {
  const { spanName, span: parentSpan, ...init } = options;
  const url = buildUrl(path);
  const spanContext = parentSpan ? trace.setSpan(context.active(), parentSpan) : context.active();
  const childSpan = tracer.startSpan(
    spanName ?? 'backend.fetch',
    {
      attributes: {
        'http.url': url,
        'http.method': (init.method ?? 'GET').toUpperCase(),
        'app.backend_base': serverConfig.backendBaseUrl
      }
    },
    spanContext
  );

  return await context.with(trace.setSpan(context.active(), childSpan), async () => {
    try {
      const headers = new Headers(init.headers ?? {});
      const bodyIsFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
      if (!headers.has('Content-Type') && !bodyIsFormData) {
        headers.set('Content-Type', 'application/json');
      }
      const response = await fetch(url, {
        cache: 'no-store',
        ...init,
        headers,
        body: init.body as BodyInit | null | undefined
      });

      const contentType = response.headers.get('content-type') ?? '';
      const payload = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const message = typeof payload === 'object' && payload !== null && 'error' in payload
          ? String((payload as Record<string, unknown>).error)
          : 'Backend request failed';
        throw new BackendHttpError(response.status, message, payload);
      }

      childSpan.setStatus({ code: SpanStatusCode.OK });
      return { data: payload as T, status: response.status };
    } catch (error) {
      childSpan.recordException(error as Error);
      const message = error instanceof Error ? error.message : 'backend fetch error';
      childSpan.setStatus({ code: SpanStatusCode.ERROR, message });
      throw error;
    } finally {
      childSpan.end();
    }
  });
}
