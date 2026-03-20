import { createQuery } from '@tanstack/svelte-query';

import type { Lab, Student } from '$lib/features/drafts/types';

import { fetchDraftees } from './http';

export function createFetchDrafteesQuery(draftId: string) {
  return createQuery(() => ({
    queryKey: ['drafts', 'fetch-draftees', draftId] as const,
    async queryFn({ queryKey: [, , id] }) {
      return await fetchDraftees(id);
    },
  }));
}

export function selectDrafted(students: Student[], lab?: Pick<Lab, 'id'>) {
  const drafted = students.filter(({ labId }) => labId !== null);
  return typeof lab === 'undefined' ? drafted : drafted.filter(student => student.labId === lab.id);
}

export function selectAvailable(students: Student[], lab?: Pick<Lab, 'id'>, round?: number) {
  const available = students.filter(({ labId }) => labId === null);
  return typeof lab === 'undefined' || typeof round === 'undefined'
    ? available
    : available.filter(student => student.labs[round - 1] === lab.id);
}

export function selectInterested(students: Student[], lab: Pick<Lab, 'id'>, round: number) {
  return students
    .filter(({ labId }) => labId === null)
    .filter(student => student.labs.slice(round).includes(lab.id));
}

export function selectUndraftedAfterRegular(students: Student[], regularDraftedIds: Set<string>) {
  return students.filter(({ id }) => !regularDraftedIds.has(id));
}
