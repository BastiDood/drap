import { expect, test } from '@playwright/test';

test('should display the privacy page', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
});
