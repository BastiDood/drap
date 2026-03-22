import { describe, expect, it } from 'vitest';

import { stripPrefix } from './strings';

describe('stripPrefix', () => {
  it('returns the suffix when the prefix matches', () => {
    expect(stripPrefix('response-item1', 'response-')).toBe('item1');
  });

  it('returns undefined when the prefix does not match', () => {
    expect(stripPrefix('item1', 'response-')).toBeUndefined();
  });

  it('returns an empty string when the text is exactly the prefix', () => {
    expect(stripPrefix('response-', 'response-')).toBe('');
  });
});
