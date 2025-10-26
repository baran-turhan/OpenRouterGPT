import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const serviceName = process.env.OTEL_SERVICE_NAME ?? 'madlen-chat-frontend';
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces';
const environment = process.env.NODE_ENV ?? 'development';

let sdk: NodeSDK | null = null;

export const initFrontendTelemetry = (): void => {
  if (sdk) {
    return;
  }

  const traceExporter = new OTLPTraceExporter({ url: otlpEndpoint });
  const resource = resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment
  });

  sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations()]
  });

  try {
    sdk.start();
  } catch (error) {
    console.error('Unable to start frontend telemetry', error);
  }

  const shutdown = async () => {
    if (!sdk) return;
    try {
      await sdk.shutdown();
      sdk = null;
    } catch (error) {
      console.error('Error shutting down frontend telemetry', error);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};
