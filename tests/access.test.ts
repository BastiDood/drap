import { expect } from '@playwright/test';

import { test } from './fixtures/users';
test('Empty draft history and administration', { tag: '@initial' }, async ({ page, adminPage }) => {
  await test.step('history page shows no drafts', async () => {
    await page.goto('/history/');
    await expect(page.locator('#history-empty-state')).toBeVisible();
    await expect(page.locator('#history-draft-list')).toHaveCount(0);
  });
  await test.step('admin drafts page shows no drafts', async () => {
    await adminPage.goto('/dashboard/drafts/');
    await expect(adminPage.getByText(/no drafts|create.*first/iu)).toBeVisible();
  });
});
test('Administrators see all faculty and labs', { tag: '@initial' }, async ({ adminPage }) => {
  await test.step('admin sees faculty in users page', async () => {
    await adminPage.goto('/dashboard/users/');
    await expect(adminPage.getByText('ndsl@up.edu.ph')).toBeVisible();
    await expect(adminPage.getByText('csl@up.edu.ph')).toBeVisible();
    await expect(adminPage.getByText('scl@up.edu.ph')).toBeVisible();
    await expect(adminPage.getByText('cvmil@up.edu.ph')).toBeVisible();
    await expect(adminPage.getByText('acl@up.edu.ph')).toBeVisible();
  });
  await test.step('admin labs page shows all labs', async () => {
    await adminPage.goto('/dashboard/labs/');
    await expect(adminPage.getByText('Networks and Distributed Systems Laboratory')).toBeVisible();
    await expect(adminPage.getByText('Computer Security Laboratory')).toBeVisible();
    await expect(adminPage.getByText('Scientific Computing Laboratory')).toBeVisible();
    await expect(
      adminPage.getByText('Computer Vision and Machine Intelligence Laboratory'),
    ).toBeVisible();
    await expect(adminPage.getByText('Algorithms and Complexity Laboratory')).toBeVisible();
    await expect(adminPage.locator('input[name="draftId"]')).toHaveCount(0);
  });
});
test('Dashboard requires a session', { tag: '@initial' }, async ({ request }) => {
  const response = await request.get('/dashboard/', { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe('/dashboard/oauth/login');
});
