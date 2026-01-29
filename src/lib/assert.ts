export function assert(condition: unknown, msg = 'assertion failed'): asserts condition {
  if (!condition) throw new Error(msg);
}
