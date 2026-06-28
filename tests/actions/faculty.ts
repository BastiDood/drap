import { expect, type Page } from '@playwright/test';

export async function submitFacultySelection(
  page: Page,
  buttonName: 'Submit Selection' | 'Update Selection',
) {
  page.once('dialog', async dialog => await dialog.accept());
  const responsePromise = page.waitForResponse('/dashboard/students/?/rankings');
  await page.getByRole('button', { name: buttonName }).click();
  const response = await responsePromise;
  const responseData = await response.json();
  expect(responseData.type).toBe('success');
}

export async function expectStatCards(
  page: Page,
  expected: { quota: number; remaining: number; drafted: number },
) {
  await expect(page.locator('#stat-total-quota')).toHaveText(String(expected.quota));
  await expect(page.locator('#stat-remaining')).toHaveText(String(expected.remaining));
  await expect(page.locator('#stat-drafted')).toHaveText(String(expected.drafted));
}

export async function expectPreviousPicksTab(page: Page, round: number, studentNames: RegExp[]) {
  const panel = page.locator('#previous-picks');
  await expect(panel).toBeVisible();
  const tab = panel.getByRole('tab', { name: `Round ${round}` });
  await expect(tab).toBeVisible();
  await tab.click();
  const activeContent = panel.locator('[data-state="active"][data-slot="tabs-content"]');
  for (const name of studentNames) await expect(activeContent).toContainText(name);
}

export async function expectNoPreviousPicks(page: Page) {
  const panel = page.locator('#previous-picks');
  await expect(panel).toBeVisible();
  await expect(panel.locator('[data-slot="empty"]')).toBeVisible();
}

export async function expectStudentsCallout(
  page: Page,
  expected: string | RegExp,
  forbidden?: (string | RegExp)[],
  options?: {
    title?: string | RegExp;
    banner?: string | RegExp;
  },
) {
  await page.goto('/dashboard/students/');
  const emptyState = page.locator('[data-slot="empty"]').filter({ hasText: expected });
  await expect(emptyState).toBeVisible();
  if (typeof options?.title !== 'undefined') await expect(emptyState).toContainText(options.title);
  await expect(emptyState).toContainText(expected);
  if (typeof forbidden !== 'undefined')
    for (const matcher of forbidden) await expect(emptyState).not.toContainText(matcher);
  if (typeof options?.banner !== 'undefined') {
    const statusBanner = page.getByRole('alert');
    await expect(statusBanner).toHaveAttribute('data-variant', 'info');
    await expect(statusBanner).toContainText(options.banner);
  }

  await expect(page.locator('form[action="/dashboard/students/?/rankings"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Submit Selection' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Update Selection' })).toHaveCount(0);
}

export async function expectVisibleButtons(page: Page, labels: string[]) {
  for (const label of labels)
    await expect(page.getByRole('button', { name: label }).first()).toBeVisible();
}

export async function expectLabAssignmentMembers(
  page: Page,
  draftId: string,
  members: readonly (string | RegExp)[],
) {
  await page.goto('/dashboard/lab/');
  await page.locator(`button[data-draft-id="${draftId}"]`).click();

  for (const member of members) await expect(page.getByText(member)).toBeVisible();
}
