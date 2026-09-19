import type { Page } from '@playwright/test';
export const draftYearPattern = /Draft \d{4}/u;
export function getDraftRow(page: Page, draftId: string) {
  return page.locator(`tr[data-draft-id="${draftId}"]`);
}
export function getHistoryDraft(page: Page, draftId: string) {
  return page.locator(`#history-draft-list [data-draft-id="${draftId}"]`);
}
export async function getHistoryTimelineTexts(page: Page, draftId: number) {
  await page.goto(`/history/${draftId}/`);
  const rows = page.locator('section > ol.border-s > li.ms-6 ol.space-y-1 > li');
  const textContents = await rows.allTextContents();
  return textContents.map(text => text.replaceAll(/\s+/gu, ' ').trim());
}
