import { describe, expect, test } from 'vitest';

import {
  getSelectedIds,
  hasSelection,
  isSelectionOverQuota,
  resetSelectionState,
  toggleSelection,
} from './selection';

describe('faculty student selection', () => {
  test('keeps original selections in their submitted order and appends new selections', () => {
    expect(
      getSelectedIds(['student-2', 'student-1', 'student-4'], {
        addedIds: new Set(['student-2', 'student-3']),
        removedIds: new Set(['student-1']),
      }),
    ).toEqual(['student-2', 'student-4', 'student-3']);
  });

  test('toggles an original selection through the removed set', () => {
    const initial = ['student-1'];
    const initialState = {
      addedIds: new Set<string>(),
      removedIds: new Set<string>(),
    };
    const removed = toggleSelection('student-1', initial, initialState);
    const restored = toggleSelection('student-1', initial, removed);

    expect(initialState).toEqual({ addedIds: new Set(), removedIds: new Set() });
    expect(hasSelection('student-1', initial, removed)).toBe(false);
    expect(getSelectedIds(initial, removed)).toEqual([]);
    expect(hasSelection('student-1', initial, restored)).toBe(true);
    expect(getSelectedIds(initial, restored)).toEqual(['student-1']);
  });

  test('toggles a newly selected student through the added set and clears both changes on reset', () => {
    const added = toggleSelection('student-2', ['student-1'], {
      addedIds: new Set(),
      removedIds: new Set(),
    });
    const removed = toggleSelection('student-2', ['student-1'], added);

    expect(getSelectedIds(['student-1'], added)).toEqual(['student-1', 'student-2']);
    expect(getSelectedIds(['student-1'], removed)).toEqual(['student-1']);
    expect(getSelectedIds(['student-1'], resetSelectionState())).toEqual(['student-1']);
  });

  test('marks a selection as over quota only after it exceeds the remaining slots', () => {
    expect(isSelectionOverQuota(['student-1', 'student-2'], 2)).toBe(false);
    expect(isSelectionOverQuota(['student-1', 'student-2', 'student-3'], 2)).toBe(true);
  });
});
