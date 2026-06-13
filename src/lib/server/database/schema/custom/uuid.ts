import assert from 'node:assert/strict';

import { type CustomTypeValues, customType } from 'drizzle-orm/pg-core';

interface Config extends CustomTypeValues {
  data: string;
  config: undefined;
}

export const uuid = customType<Config>({
  dataType(config) {
    assert(typeof config === 'undefined', 'uuid does not accept configuration');
    return 'uuid';
  },
  fromDriver(value) {
    assert(typeof value === 'string', 'uuid must be a string');
    return value;
  },
});
