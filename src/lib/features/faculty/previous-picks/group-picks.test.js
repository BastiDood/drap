import { describe, expect, test } from 'vitest';

import { groupPreviousPicks } from './group-picks';

describe('groupPreviousPicks', () => {
  test('groups every pick by round and selects the numerically latest round', () => {
    const researchers = [
      { name: 'Ada', round: 10 },
      { name: 'Grace', round: 2 },
      { name: 'Katherine', round: 1 },
      { name: 'Margaret', round: 2 },
    ];

    expect(groupPreviousPicks(researchers)).toEqual({
      researchersByRound: {
        1: [{ name: 'Katherine', round: 1 }],
        2: [
          { name: 'Grace', round: 2 },
          { name: 'Margaret', round: 2 },
        ],
        10: [{ name: 'Ada', round: 10 }],
      },
      latestRound: '10',
      sortedRounds: [1, 2, 10],
    });
  });

  test('produces no round groups or tabs before any selections', () => {
    const { researchersByRound, sortedRounds } = groupPreviousPicks([]);

    expect(researchersByRound).toEqual({});
    expect(sortedRounds).toEqual([]);
  });
});
