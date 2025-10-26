import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { config } from './config';

let sdk: NodeSDK | null = null;

export const initTelemetry = (): NodeSDK => {
  if (sdk) {
    return sdk;
  }

  const resource = resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: config.telemetry.serviceName,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.env
  });

  const traceExporter = new OTLPTraceExporter({
    url: config.telemetry.otlpEndpoint
  });

  sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations()]
  });

  try {
    sdk.start();
  } catch (error: unknown) {
    console.error('Failed to start OpenTelemetry SDK', error);
  }

  const shutdown = async () => {
    if (!sdk) return;
    try {
      await sdk.shutdown();
      sdk = null;
    } catch (error: unknown) {
      console.error('Error shutting down OpenTelemetry SDK', error);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return sdk;
};
