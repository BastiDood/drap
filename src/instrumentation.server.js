import process from 'node:process';

import { inngest } from '$lib/server/inngest/client';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { InngestSpanProcessor } from 'inngest/experimental';

const sdk = new NodeSDK({
  serviceName: 'drap',
  instrumentations: [new HttpInstrumentation(), new PgInstrumentation(), new AwsInstrumentation()],
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
