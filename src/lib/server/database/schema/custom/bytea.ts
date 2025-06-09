import assert from 'node:assert/strict';

import { type CustomTypeValues, customType } from 'drizzle-orm/pg-core';

interface Config extends CustomTypeValues {
  data: Buffer;
  config: undefined;
}

export const bytea = customType<Config>({
  dataType(config) {
    assert(typeof config === 'undefined', 'bytea does not accept configuration');
    return 'bytea';
  },
  fromDriver(value) {
    assert(value instanceof Buffer, 'bytea must be a Buffer instance');
    return value;
  },
});
