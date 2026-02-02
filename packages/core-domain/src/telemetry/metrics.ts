// otel-metrics.ts - OpenTelemetry Metrics Configuration
import { metrics } from '@opentelemetry/api';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

const resource = resourceFromAttributes({
  [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'heady-service',
});

const exporter = new OTLPMetricExporter({
  url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || 'http://localhost:4318/v1/metrics',
});

const reader = new PeriodicExportingMetricReader({
  exporter,
  exportIntervalMillis: 10000, // 10s default
});

const meterProvider = new MeterProvider({
  resource,
  readers: [reader],
});

metrics.setGlobalMeterProvider(meterProvider);

export const meter = metrics.getMeter('heady-metrics');

// Define standard metrics
export const httpRequests = meter.createCounter('heady_http_requests_total', {
  description: 'Total HTTP requests received',
  unit: '{requests}',
});

export const wsConnections = meter.createUpDownCounter('heady_ws_active_connections', {
  description: 'Active WebSocket connections',
  unit: '{connections}',
});

export const requestDuration = meter.createHistogram('heady_http_request_duration_seconds', {
  description: 'HTTP request duration in seconds',
  unit: 's',
});
