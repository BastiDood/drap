import assert from 'node:assert/strict';

import { type CustomTypeValues, customType } from 'drizzle-orm/pg-core';

interface Config extends CustomTypeValues {
  data: string;
  config: undefined;
}

export const ulid = customType<Config>({
  dataType(config) {
    assert(typeof config === 'undefined', 'ulid does not accept configuration');
    return 'ulid';
  },
  fromDriver(value) {
    assert(typeof value === 'string', 'ulid must be a string');
    return value;
  },
});
