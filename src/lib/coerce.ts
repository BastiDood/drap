import { date, number, parse, string, union } from 'valibot';

export class CoercionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CoercionError';
  }
}

export const ParsableDate = union([string(), number(), date()]);

export function coerceDate(value: unknown) {
  return new Date(parse(ParsableDate, value));
}

export function coerceNullableDate(value: unknown) {
  return value === null ? null : coerceDate(value);
}

export function coerceNumber(value: unknown) {
  switch (typeof value) {
    case 'number':
      return value;
    case 'string': {
      const parsed = Number.parseFloat(value);
      if (Number.isNaN(parsed)) throw new CoercionError(`expected a numeric string, got: ${value}`);
      return parsed;
    }
    default:
      throw new CoercionError('expected a number');
  }
}

export function coerceNullableNumber(value: unknown) {
  return value === null ? null : coerceNumber(value);
}
