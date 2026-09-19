import { assert } from '$lib/assert';

export interface LabPreferences<Lab> {
  selectedLabs: Lab[];
  availableLabs: Lab[];
}

export function selectLab<Lab>(preferences: LabPreferences<Lab>, maxRounds: number, index: number) {
  if (preferences.selectedLabs.length >= maxRounds) return;

  const selectedLabs = [...preferences.selectedLabs];
  const availableLabs = [...preferences.availableLabs];
  selectedLabs.push(...availableLabs.splice(index, 1));

  return { selectedLabs, availableLabs };
}

export function moveLabUp<Lab>(selectedLabs: Lab[], index: number) {
  const below = index;
  const above = index - 1;
  if (above < 0) return;

  const next = [...selectedLabs];
  const current = next[below];
  assert(typeof current !== 'undefined');
  const previous = next[above];
  assert(typeof previous !== 'undefined');

  next[below] = previous;
  next[above] = current;

  return next;
}

export function moveLabDown<Lab>(selectedLabs: Lab[], index: number) {
  const above = index;
  const below = index + 1;
  if (below >= selectedLabs.length) return;

  const next = [...selectedLabs];
  const current = next[below];
  assert(typeof current !== 'undefined');
  const previous = next[above];
  assert(typeof previous !== 'undefined');

  next[below] = previous;
  next[above] = current;

  return next;
}

export function removeSelectedLab<Lab>(preferences: LabPreferences<Lab>, index: number) {
  const selectedLabs = [...preferences.selectedLabs];
  const availableLabs = [...preferences.availableLabs];
  availableLabs.push(...selectedLabs.splice(index, 1));

  return { selectedLabs, availableLabs };
}
