import type { Page } from '@playwright/test';
export async function postFacultyRankings(
  page: Page,
  draft: number,
  round: number,
  students: string[] = [],
) {
  return await page.evaluate(
    async ({ draft, round, students }) => {
      const data = new FormData();
      data.set('draft', String(draft));
      data.set('round', String(round));
      for (const student of students) data.append('students', student);

      const response = await fetch('/dashboard/students/?/rankings', {
        method: 'POST',
        body: data,
      });

      return response.status;
    },
    { draft, round, students },
  );
}
export async function postInterventions(page: Page, draft: number, pairs: Record<string, string>) {
  return await page.evaluate(
    async ({ draft, pairs }) => {
      const data = new FormData();
      data.set('draft', String(draft));
      for (const [studentUserId, labId] of Object.entries(pairs)) data.set(studentUserId, labId);

      const response = await fetch(`/dashboard/drafts/${draft}/?/intervene`, {
        method: 'POST',
        body: data,
      });

      return response.status;
    },
    { draft, pairs },
  );
}
