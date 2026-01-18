import { type Span, type Tracer as OpenTelemetryTracer, trace } from '@opentelemetry/api';

import { Logger } from './logger';

export class Tracer {
  static #LOGGER = Logger.byName('tracer');

  #tracer: OpenTelemetryTracer;

  constructor(tracer: OpenTelemetryTracer) {
    this.#tracer = tracer;
  }

  static byName(name: string) {
    return new Tracer(trace.getTracer(name));
  }

  /** Use for synchronous operations. */
  span<T>(name: string, fn: (span: Span) => T) {
    return this.#tracer.startActiveSpan(name, span => {
      try {
        return fn(span);
      } catch (error) {
        if (error instanceof Error) Tracer.#LOGGER.fatal('unhandled error', error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /** Use for asynchronous operations. */
  async asyncSpan<T>(name: string, fn: (span: Span) => Promise<T>) {
    return await this.#tracer.startActiveSpan(name, async span => {
      try {
        return await fn(span);
      } catch (error) {
        if (error instanceof Error) Tracer.#LOGGER.fatal('unhandled error', error);
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
