import { expect, type Page } from '@playwright/test';

export async function expectSheetContents(
  page: Page,
  triggerName: string,
  expectedVisible: (string | RegExp)[],
  expectedHidden?: (string | RegExp)[],
) {
  await page.getByRole('button', { name: triggerName }).first().click();

  const sheet = page.locator('[data-slot="sheet-content"]').last();
  await expect(sheet).toBeVisible();

  for (const value of expectedVisible) await expect(sheet).toContainText(value);
  if (typeof expectedHidden !== 'undefined')
    for (const value of expectedHidden) await expect(sheet).not.toContainText(value);

  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
}

export async function expectDrawerContents(
  page: Page,
  triggerName: string,
  expectedVisible: (string | RegExp)[],
  expectedHidden?: (string | RegExp)[],
) {
  await page.getByRole('button', { name: triggerName }).first().click();

  const drawer = page.locator('[data-slot="drawer-content"]').last();
  await expect(drawer).toBeVisible();

  for (const value of expectedVisible) await expect(drawer).toContainText(value);
  if (typeof expectedHidden !== 'undefined')
    for (const value of expectedHidden) await expect(drawer).not.toContainText(value);

  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
}

export async function openAllowlistSheet(page: Page, draftId: string) {
  const allowlistResponsePromise = page.waitForResponse(`/dashboard/drafts/${draftId}/allowlist`);
  await page.getByRole('button', { name: 'Manage Allowlist' }).click();
  const allowlistResponse = await allowlistResponsePromise;
  expect(allowlistResponse.ok()).toBeTruthy();

  const allowlistSheet = page.locator('[data-slot="sheet-content"]').last();
  await expect(allowlistSheet).toBeVisible();
  return allowlistSheet;
}
