import { expect, type Page } from '@playwright/test';

export async function assertLogout(page: Page) {
  await page.goto('/dashboard/');
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('heading', { name: 'Draft Ranking Automated Processor' }),
  ).toBeVisible();
}
