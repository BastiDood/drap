import assert from 'node:assert/strict';

import { type CustomTypeValues, customType } from 'drizzle-orm/pg-core';

interface Config extends CustomTypeValues {
  data: Buffer<ArrayBuffer>;
  config: undefined;
}

export const bytea = customType<Config>({
  dataType(config) {
    assert(typeof config === 'undefined', 'bytea does not accept configuration');
    return 'bytea';
  },
  fromDriver(value) {
    assert(value instanceof Buffer, 'bytea must be a Buffer instance');
    assert(value.buffer instanceof ArrayBuffer, 'bytea must be an ArrayBuffer');
    return value as Buffer<ArrayBuffer>;
  },
});
