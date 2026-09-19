import { describe, expect, test } from 'vitest';

import { moveLabDown, moveLabUp, removeSelectedLab, selectLab } from './selection';

describe('lab preference selection', () => {
  test('moves an available lab into the ranking until the selection quota is full', () => {
    const initial = {
      selectedLabs: ['algorithms'],
      availableLabs: ['systems', 'theory'],
    };

    const selected = selectLab(initial, 2, 1);

    expect(selected).toEqual({
      selectedLabs: ['algorithms', 'theory'],
      availableLabs: ['systems'],
    });
    expect(initial).toEqual({
      selectedLabs: ['algorithms'],
      availableLabs: ['systems', 'theory'],
    });
    expect(selectLab(initial, 1, 0)).toBeUndefined();
  });

  test('moves ranked labs up and down without changing membership', () => {
    const rankedLabs = ['algorithms', 'systems', 'theory'];

    expect(moveLabUp(rankedLabs, 2)).toEqual(['algorithms', 'theory', 'systems']);
    expect(moveLabDown(rankedLabs, 0)).toEqual(['systems', 'algorithms', 'theory']);
    expect(moveLabUp(rankedLabs, 0)).toBeUndefined();
    expect(moveLabDown(rankedLabs, 2)).toBeUndefined();
    expect(rankedLabs).toEqual(['algorithms', 'systems', 'theory']);
  });

  test('returns a removed ranked lab to the end of the available list', () => {
    expect(
      removeSelectedLab({ selectedLabs: ['algorithms', 'systems'], availableLabs: ['theory'] }, 0),
    ).toEqual({
      selectedLabs: ['systems'],
      availableLabs: ['theory', 'algorithms'],
    });
  });
});
