import { createDraft } from '$tests/actions/draft';
import { draftYearPattern, getDraftRow, getHistoryDraft } from '$tests/actions/history';
import { completeStudentProfile, submitLabPreferences } from '$tests/actions/student';
import { test } from '$tests/fixtures/users';
import { expect } from '@playwright/test';
import { addDays } from 'date-fns';

test.describe('Archived-Lab Draft Setup', { tag: '@archived-labs-setup' }, () => {
  test.describe.configure({ mode: 'serial' });

  test('archives ACL, creates the draft snapshot, and rejects unsnapshotted quota changes', async ({
    adminPage,
  }) => {
    await test.step('archive ACL before taking the snapshot', async () => {
      await adminPage.goto('/dashboard/labs/');
      const aclRow = adminPage
        .locator('tbody tr')
        .filter({ hasText: 'Algorithms and Complexity Laboratory' });
      await expect(aclRow).toBeVisible();
      const responsePromise = adminPage.waitForResponse('/dashboard/labs/?/archive');
      await aclRow.getByRole('button').click();
      const response = await responsePromise;
      const { type } = await response.json();
      expect(type).toBe('success');
      await adminPage.getByRole('tab', { name: /Archived Labs/u }).click();
      await expect(adminPage.getByText('Algorithms and Complexity Laboratory')).toBeVisible();
    });

    await test.step('create the two-round draft', async () => {
      await createDraft(adminPage, { closesAt: addDays(new Date(), 1), rounds: 2 });
      await expect(getDraftRow(adminPage, '2').locator('td').first()).toHaveText(/\d{4}/u);
      await expect(adminPage.getByText('Registration')).toBeVisible();
    });

    await test.step('reject quota changes for labs absent from the snapshot', async () => {
      const status = await adminPage.evaluate(async () => {
        const data = new FormData();
        data.set('draft', '2');
        data.set('kind', 'initial');
        data.set('acl', '1');
        const { status } = await fetch('/dashboard/drafts/2/?/quota', {
          method: 'POST',
          body: data,
        });
        return status;
      });
      expect(status).toBe(400);
    });
  });

  test('keeps archived labs out of registration and rejects forged submissions', async ({
    snapshotGuardStudentPage,
  }) => {
    await completeStudentProfile(snapshotGuardStudentPage, '202112399');
    await expect(snapshotGuardStudentPage.getByText('Select Lab Preference')).toBeVisible();
    await expect(
      snapshotGuardStudentPage.getByRole('button', {
        name: 'Algorithms and Complexity Laboratory',
      }),
    ).toHaveCount(0);

    const archivedStatus = await snapshotGuardStudentPage.evaluate(async () => {
      const data = new FormData();
      data.set('draft', '2');
      data.append('labs', 'acl');
      data.append('remarks', '');
      const { status } = await fetch('/dashboard/student/?/submit', { method: 'POST', body: data });
      return status;
    });
    expect(archivedStatus).toBe(400);

    const missingRemarksStatus = await snapshotGuardStudentPage.evaluate(async () => {
      const data = new FormData();
      data.set('draft', '2');
      data.append('labs', 'csl');
      const { status } = await fetch('/dashboard/student/?/submit', { method: 'POST', body: data });
      return status;
    });
    expect(missingRemarksStatus).toBe(500);
  });
});

test.describe(
  'Archived-Lab Draft Registration',
  { tag: '@archived-labs-register-students' },
  () => {
    test.describe.configure({ mode: 'parallel' });

    test('registers SecondNdsl with NDSL then CSL preferences', async ({
      secondRoundNdslFirstChoicePage,
    }) => {
      await completeStudentProfile(secondRoundNdslFirstChoicePage, '202112360');
      await submitLabPreferences(secondRoundNdslFirstChoicePage, {
        labs: ['Networks and Distributed Systems Laboratory', 'Computer Security Laboratory'],
        photoConsent: 'google',
        remarks: `${'a'.repeat(1027)}\n`,
      });
    });

    test('registers SecondCsl with CSL then NDSL preferences', async ({
      secondRoundCslFirstChoicePage,
    }) => {
      await completeStudentProfile(secondRoundCslFirstChoicePage, '202112361');
      await submitLabPreferences(secondRoundCslFirstChoicePage, {
        labs: ['Computer Security Laboratory', 'Networks and Distributed Systems Laboratory'],
        photoConsent: 'none',
      });
    });

    test('registers SecondScl with NDSL then SCL preferences', async ({
      secondRoundSclSecondChoicePage,
    }) => {
      await completeStudentProfile(secondRoundSclSecondChoicePage, '202112362');
      await submitLabPreferences(secondRoundSclSecondChoicePage, {
        labs: ['Networks and Distributed Systems Laboratory', 'Scientific Computing Laboratory'],
        photoConsent: 'google',
      });
    });

    test('shows the second draft as registering in history', async ({ page }) => {
      await page.goto('/history/');
      await expect(getHistoryDraft(page, '2')).toContainText(draftYearPattern);
      await expect(page.getByText('currently waiting for students to register')).toBeVisible();
      await page.goto('/history/2/');
      await expect(page.getByText('registration stage')).toBeVisible();
    });
  },
);
