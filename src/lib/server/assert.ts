import assert, { strictEqual } from 'node:assert/strict';

export function assertDefined<T>(result?: T) {
  assert(typeof result !== 'undefined', 'missing result');
  return result;
}

export function assertOptional<T>([result, ...rest]: T[]) {
  strictEqual(rest.length, 0, 'too many results');
  return result;
}

export function assertSingle<T>(results: T[]) {
  const result = assertOptional(results);
  assert(typeof result !== 'undefined', 'missing result');
  return result;
}
