import { describe, expect, test } from 'vitest';

import { keyForRank } from './lottery-outcome-chart-utils';

describe('keyForRank', () => {
  test.each([
    [1, 'rank-1'],
    [2, 'rank-2'],
    [10, 'rank-10'],
    [null, 'not-preferred'],
  ] as const)('rank %s → %s', (rank, expected) => {
    expect(keyForRank(rank)).toBe(expected);
  });

  test('never contains whitespace (CSS custom property safety)', () => {
    for (const rank of [null, 1, 2, 5, 99] as const) expect(keyForRank(rank)).not.toMatch(/\s/u);
  });

  test('never starts with a digit (CSS custom property safety)', () => {
    for (const rank of [1, 2, 10, 99] as const) expect(keyForRank(rank)).not.toMatch(/^\d/u);
  });
});
