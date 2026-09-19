import {
  openInterventions,
  runLottery,
  startDraft,
  updateInitialQuota,
  updateLotteryQuota,
} from '$tests/actions/draft';
import {
  expectPreviousPicksTab,
  expectStudentsCallout,
  expectVisibleButtons,
  submitFacultySelection,
} from '$tests/actions/faculty';
import { test } from '$tests/fixtures/users';
import { expect } from '@playwright/test';

test.describe('Archived-Lab Draft Start', { tag: '@archived-labs-start' }, () => {
  test.describe.configure({ mode: 'serial' });

  test('sets quotas, starts the draft, and retains CSL rankings after archival', async ({
    adminPage,
    sclHeadPage,
    cvmilHeadPage,
    aclHeadPage,
    secondRoundCslFirstChoicePage,
  }) => {
    await test.step('verify registrants and set initial snapshots', async () => {
      await adminPage.goto('/dashboard/drafts/2/');
      await expect(adminPage.getByText('Registered Students', { exact: true })).toBeVisible();
      await expect(adminPage.getByText('Current Draft Participants')).toBeVisible();
      await expect(adminPage.getByText(/\b3\b/u).first()).toBeVisible();
      await updateInitialQuota(adminPage, '2', { csl: 1, cvmil: 0, ndsl: 1, scl: 1 });
    });
    await test.step('start the draft and verify automatic acknowledgements', async () => {
      await adminPage.goto('/dashboard/drafts/2/');
      await expect(adminPage.getByText('Registered Students', { exact: true })).toBeVisible();
      await expect(adminPage.getByText('Current Draft Participants')).toBeVisible();
      await expect(adminPage.getByText(/\b3\b/u).first()).toBeVisible();
      await startDraft(adminPage, '2');
      await expect(adminPage.getByText(/Round 1/u).first()).toBeVisible();
      await expectStudentsCallout(
        sclHeadPage,
        'No undrafted students have selected this lab in this round.',
        ['This lab has no more draft slots remaining for the rest of this draft.'],
      );
      await expectStudentsCallout(
        cvmilHeadPage,
        'This lab has no more draft slots remaining for the rest of this draft.',
      );
      await aclHeadPage.goto('/dashboard/students');
      await expect(aclHeadPage.getByText('Lab Excluded from This Draft')).toBeVisible();
    });
    await test.step('archive CSL without removing its current-draft ranking', async () => {
      await adminPage.goto('/dashboard/labs/');
      const cslRow = adminPage
        .locator('tbody tr')
        .filter({ hasText: 'Computer Security Laboratory' });
      await expect(cslRow).toBeVisible();
      const responsePromise = adminPage.waitForResponse('/dashboard/labs/?/archive');
      await cslRow.getByRole('button').click();
      const response = await responsePromise;
      const { type } = await response.json();
      expect(type).toBe('success');
      await secondRoundCslFirstChoicePage.goto('/dashboard/student/');
      await expect(
        secondRoundCslFirstChoicePage.getByText('Your Lab Preferences', { exact: true }),
      ).toBeVisible();
      await expect(
        secondRoundCslFirstChoicePage.getByText('Computer Security Laboratory'),
      ).toBeVisible();
    });
  });
});

test.describe('Archived-Lab Draft Round One', { tag: '@archived-labs-select' }, () => {
  test.describe.configure({ mode: 'parallel' });

  test('NDSL selects SecondNdsl and records its round-one pick', async ({ ndslHeadPage }) => {
    await ndslHeadPage.goto('/dashboard/students/');
    await expect(ndslHeadPage.getByRole('button', { name: /SecondNdsl/u })).toBeVisible();
    await expect(ndslHeadPage.getByRole('button', { name: /SecondScl/u })).toBeVisible();
    await ndslHeadPage.getByRole('button', { name: /SecondNdsl/u }).click();
    await submitFacultySelection(ndslHeadPage, 'Submit Selection');
    await expectStudentsCallout(
      ndslHeadPage,
      'This lab has no more draft slots remaining for the rest of this draft.',
    );
    await expectPreviousPicksTab(ndslHeadPage, 1, [/SecondNdsl/u]);
  });

  test('CSL selects SecondCsl', async ({ cslHeadPage }) => {
    await cslHeadPage.goto('/dashboard/students/');
    await expect(cslHeadPage.getByRole('button', { name: /SecondCsl/u })).toBeVisible();
    await cslHeadPage.getByRole('button', { name: /SecondCsl/u }).click();
    await submitFacultySelection(cslHeadPage, 'Submit Selection');
    await expectStudentsCallout(
      cslHeadPage,
      'This lab has no more draft slots remaining for the rest of this draft.',
    );
  });
});

test(
  'Complete round two, run the empty lottery, and finalize',
  { tag: '@archived-labs-complete' },
  async ({ adminPage, cvmilHeadPage, ndslHeadPage, cslHeadPage, sclHeadPage }) => {
    await test.step('advances to round two, handles automatic acknowledgements, and lets SCL finish selection', async () => {
      await test.step('verify the second round and automatic acknowledgements', async () => {
        await adminPage.goto('/dashboard/drafts/2/');
        await expect(adminPage.getByText(/Round 2/u).first()).toBeVisible();
        await expectStudentsCallout(
          cvmilHeadPage,
          'This lab has no more draft slots remaining for the rest of this draft.',
        );
        await expectStudentsCallout(
          ndslHeadPage,
          'This lab has no more draft slots remaining for the rest of this draft.',
        );
        await expectStudentsCallout(
          cslHeadPage,
          'This lab has no more draft slots remaining for the rest of this draft.',
        );
      });
      await test.step('have SCL select SecondScl and enter lottery', async () => {
        await sclHeadPage.goto('/dashboard/students/');
        await expect(sclHeadPage.getByRole('button', { name: /SecondScl/u })).toBeVisible();
        await sclHeadPage.getByRole('button', { name: /SecondScl/u }).click();
        await submitFacultySelection(sclHeadPage, 'Submit Selection');
        await expectStudentsCallout(
          sclHeadPage,
          'The draft is now in the lottery stage. Kindly contact the draft administrators on how to proceed.',
        );
      });
      await test.step('show zero eligible students and reject an unsnapshotted intervention', async () => {
        await adminPage.goto('/dashboard/drafts/2/');
        await expect(adminPage.getByRole('heading', { name: 'Interventions' })).toBeVisible();
        await openInterventions(adminPage);
        await expectVisibleButtons(adminPage, ['Show Eligible Students']);
        await adminPage.getByRole('button', { name: 'Show Eligible Students' }).first().click();
        await expect(
          adminPage.getByText('All students for this draft have been drafted. Yippee!'),
        ).toBeVisible();
        const status = await adminPage.evaluate(async () => {
          const data = new FormData();
          data.set('draft', '2');
          data.set('00000000000000000000000000', 'acl');
          const { status } = await fetch('/dashboard/drafts/2/?/intervene', {
            method: 'POST',
            body: data,
          });
          return status;
        });
        expect(status).toBe(400);
      });
    });
    await test.step('uses zero lottery quotas, reviews the result, and finalizes the draft', async () => {
      await updateLotteryQuota(adminPage, '2', { csl: 0, cvmil: 0, ndsl: 0, scl: 0 });
      await runLottery(adminPage, '2');
      await adminPage.goto('/dashboard/drafts/2/');
      await expect(adminPage.getByText(/Started .* · Review/u)).toBeVisible();
      await expect(adminPage.getByRole('heading', { name: 'Review Phase' })).toHaveCount(0);
      await expect(adminPage.getByRole('heading', { name: 'Lottery Phase' })).toHaveCount(0);
      await expect(adminPage.getByRole('button', { name: /^Review$/u })).toHaveCount(0);
      await expect(adminPage.getByRole('button', { name: 'Finalize Draft' })).toBeVisible();
      const responsePromise = adminPage.waitForResponse('/dashboard/drafts/2/?/finalize');
      adminPage.once('dialog', async dialog => await dialog.accept());
      await adminPage.getByRole('button', { name: 'Finalize Draft' }).click();
      const response = await responsePromise;
      const { type } = await response.json();
      expect(type).toBe('success');
    });
  },
);
