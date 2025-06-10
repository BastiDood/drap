import type { Logger } from 'pino';
import assert from 'node:assert/strict';

export interface Loggable {
  logger: Logger;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function timed<This extends Loggable, Return, Args extends any[]>(
  target: This,
  key: keyof typeof target,
  descriptor: TypedPropertyDescriptor<(this: typeof target, ...args: Args) => Return>,
) {
  const inner = descriptor.value;
  assert(typeof inner !== 'undefined');
  descriptor.value = function (this, ...args) {
    const start = performance.now();
    const value = inner.apply(this, args);
    const end = performance.now();
    this.logger.info({ query_name: key, query_time: end - start });
    return value;
  };
}
