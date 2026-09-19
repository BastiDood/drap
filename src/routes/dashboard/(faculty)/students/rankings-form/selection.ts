export interface SelectionState {
  addedIds: ReadonlySet<string>;
  removedIds: ReadonlySet<string>;
}

export function getSelectedIds(
  initialSelectedIds: string[],
  { addedIds, removedIds }: SelectionState,
) {
  const ids: string[] = [];
  for (const id of initialSelectedIds) if (!removedIds.has(id)) ids.push(id);
  for (const id of addedIds) if (!initialSelectedIds.includes(id)) ids.push(id);
  return ids;
}

export function hasSelection(
  id: string,
  initialSelectedIds: string[],
  { addedIds, removedIds }: SelectionState,
) {
  return (initialSelectedIds.includes(id) && !removedIds.has(id)) || addedIds.has(id);
}

export function isSelectionOverQuota(selectedIds: string[], remainingQuota: number) {
  return remainingQuota - selectedIds.length < 0;
}

export function toggleSelection(
  id: string,
  initialSelectedIds: string[],
  { addedIds, removedIds }: SelectionState,
) {
  const nextAddedIds = new Set(addedIds);
  const nextRemovedIds = new Set(removedIds);

  if (initialSelectedIds.includes(id))
    if (nextRemovedIds.has(id)) nextRemovedIds.delete(id);
    else nextRemovedIds.add(id);
  else if (nextAddedIds.has(id)) nextAddedIds.delete(id);
  else nextAddedIds.add(id);

  return { addedIds: nextAddedIds, removedIds: nextRemovedIds };
}

export function resetSelectionState() {
  return { addedIds: new Set<string>(), removedIds: new Set<string>() };
}
