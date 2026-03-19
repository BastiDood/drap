import process from 'node:process';

import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { InngestSpanProcessor } from 'inngest/experimental';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';

import { inngest } from '$lib/server/inngest/client';

const sdk = new NodeSDK({
  serviceName: 'drap',
  instrumentations: [new HttpInstrumentation(), new PgInstrumentation()],
  spanProcessors: [
    new BatchSpanProcessor(new OTLPTraceExporter()),
    new InngestSpanProcessor(inngest),
  ],
});
sdk.start();

process.once('sveltekit:shutdown', async reason => {
  // eslint-disable-next-line no-console
  console.warn('graceful shutdown...', reason);
  await sdk.shutdown();
});
