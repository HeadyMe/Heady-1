// tracing.ts - OpenTelemetry Tracing Configuration
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Configure the trace exporter
const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
});

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'heady-service',
  }),
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

// Initialize the SDK
export function startTracing() {
  sdk.start();
  // eslint-disable-next-line no-console
  console.log('🔭 Heady OpenTelemetry tracing started');
}

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    // eslint-disable-next-line no-console
    .then(() => console.log('Tracing terminated'))
    // eslint-disable-next-line no-console
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

export { sdk };
