import assert from 'node:assert/strict';

import { type CustomTypeValues, customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export class ClosedTimestampWithTimezoneRange {
  constructor(
    public start: Date,
    public end: Date,
  ) {
    // Intentionally empty.
  }

  static #PATTERN = /^\[(?<start>.*?),(?<end>.*?)\]$/u;
  static parse(input: string) {
    const match = input.match(ClosedTimestampWithTimezoneRange.#PATTERN);
    if (typeof match?.groups === 'undefined') return null;

    const { start, end } = match.groups;
    if (typeof start === 'undefined' || typeof end === 'undefined') return null;

    return new ClosedTimestampWithTimezoneRange(new Date(start), new Date(end));
  }

  get sql() {
    return sql`tstzrange(${this.start}, ${this.end}, '[]')`;
  }
}

interface Config extends CustomTypeValues {
  data: ClosedTimestampWithTimezoneRange;
  config: undefined;
}

export const tstzrange = customType<Config>({
  dataType(config) {
    assert(typeof config === 'undefined', 'tstzrange does not accept configuration');
    return 'tstzrange';
  },
  fromDriver(value) {
    assert(typeof value === 'string', 'tstzrange from the driver must be a string');
    const result = ClosedTimestampWithTimezoneRange.parse(value);
    assert(result !== null, 'tstzrange must be parsable');
    return result;
  },
  toDriver({ sql }) {
    return sql;
  },
});
