import { describe, expect, it } from 'vitest';

import { getOrdinalSuffix } from './ordinal';

describe('getOrdinalSuffix', () => {
  it('returns st, nd, and rd for ordinary cases', () => {
    expect(getOrdinalSuffix(1)).toBe('st');
    expect(getOrdinalSuffix(2)).toBe('nd');
    expect(getOrdinalSuffix(3)).toBe('rd');
  });

  it('returns th for teen exceptions', () => {
    expect(getOrdinalSuffix(11)).toBe('th');
    expect(getOrdinalSuffix(12)).toBe('th');
    expect(getOrdinalSuffix(13)).toBe('th');
  });

  it('returns suffixes correctly for larger ordinals', () => {
    expect(getOrdinalSuffix(21)).toBe('st');
    expect(getOrdinalSuffix(42)).toBe('nd');
    expect(getOrdinalSuffix(103)).toBe('rd');
    expect(getOrdinalSuffix(100)).toBe('th');
  });
});
