import { createDraft, finalizeDraft, runLottery, startDraft } from '$tests/actions/draft';
import { expectNoRequests } from '$tests/actions/network';
import { openAllowlistSheet } from '$tests/actions/overlays';
import { test } from '$tests/fixtures/users';
import { expect } from '@playwright/test';
import { subDays } from 'date-fns';

test.describe('Closed Registration Draft', { tag: '@closed-registration' }, () => {
  test.describe.configure({ mode: 'serial' });

  test('manages the allowlist and completes the zero-quota lifecycle', async ({ adminPage }) => {
    const draftPath = '/dashboard/drafts/3/';
    await test.step('create a draft that is already closed', async () => {
      await createDraft(adminPage, { closesAt: subDays(new Date(), 1), rounds: 1 });
      await adminPage.goto(draftPath);
      await expect(adminPage.getByRole('button', { name: 'Manage Allowlist' })).toBeVisible();
      await expect(
        adminPage.getByText('No students are currently on the allowlist.'),
      ).toBeVisible();
    });
    await test.step('load the allowlist only when its sheet opens', async () => {
      await expectNoRequests(adminPage, '/dashboard/drafts/3/allowlist', async () => {
        await adminPage.goto(draftPath);
        await expect(adminPage.getByRole('button', { name: 'Manage Allowlist' })).toBeVisible();
      });
      const sheet = await openAllowlistSheet(adminPage, '3');
      await expect(sheet.getByText('No students on the allowlist')).toBeVisible();
      await adminPage.keyboard.press('Escape');
      await expect(sheet).toBeHidden();
    });
    await test.step('add and remove a late registrant', async () => {
      await adminPage.goto(draftPath);
      const sheet = await openAllowlistSheet(adminPage, '3');
      await expect(sheet.getByText('No students on the allowlist')).toBeVisible();
      const addResponsePromise = adminPage.waitForResponse(
        '/dashboard/drafts/3/?/add-to-allowlist',
      );
      const refetchAfterAddPromise = adminPage.waitForResponse('/dashboard/drafts/3/allowlist');
      await sheet.getByLabel('Student Email').fill('late.student@up.edu.ph');
      await sheet.getByRole('button', { name: 'Add to Allowlist' }).click();
      const addResponse = await addResponsePromise;
      expect(addResponse.ok()).toBeTruthy();
      const { type } = await addResponse.json();
      expect(type).toBe('success');
      const addRefetchResponse = await refetchAfterAddPromise;
      expect(addRefetchResponse.ok()).toBeTruthy();
      await expect(sheet.getByText('late.student@up.edu.ph')).toBeVisible();
      await expect(adminPage.getByText('1 student is currently on the allowlist.')).toBeVisible();

      const row = sheet
        .getByRole('link', { name: 'late.student@up.edu.ph' })
        .locator('xpath=ancestor::div[contains(@class, "border-dashed")][1]');
      const removeResponsePromise = adminPage.waitForResponse(
        '/dashboard/drafts/3/?/remove-from-allowlist',
      );
      const refetchAfterRemovePromise = adminPage.waitForResponse('/dashboard/drafts/3/allowlist');
      await row.getByRole('button', { name: 'Remove from Allowlist' }).click();
      const removeResponse = await removeResponsePromise;
      expect(removeResponse.ok()).toBeTruthy();
      const removeRefetchResponse = await refetchAfterRemovePromise;
      expect(removeRefetchResponse.ok()).toBeTruthy();
      await expect(sheet.getByText('No students on the allowlist')).toBeVisible();
      await expect(
        adminPage.getByText('No students are currently on the allowlist.'),
      ).toBeVisible();
    });
    await test.step('follow the normal zero-quota lifecycle', async () => {
      await startDraft(adminPage, '3');
      await expect(adminPage.getByText(/Started .* · Interventions/u)).toBeVisible();
      await expect(adminPage.getByRole('heading', { name: 'Interventions' })).toBeVisible();
      await runLottery(adminPage, '3');
      await expect(adminPage.getByText(/Started .* · Review/u)).toBeVisible();
      await expect(adminPage.getByRole('button', { name: 'Finalize Draft' })).toBeVisible();
      await finalizeDraft(adminPage, '3');
      await expect(adminPage.getByText(/Started .* · Finalized/u)).toBeVisible();
    });
  });
});
