import { finalizeDraft, openInterventions, runLottery } from '$tests/actions/draft';
import {
  expectPreviousPicksTab,
  expectStudentsCallout,
  expectVisibleButtons,
} from '$tests/actions/faculty';
import { expectNoRequests } from '$tests/actions/network';
import { expectSheetContents } from '$tests/actions/overlays';
import { postInterventions } from '$tests/actions/server';
import { test } from '$tests/fixtures/users';
import { expect } from '@playwright/test';

test.describe('Primary Draft Lottery', { tag: '@full-lifecycle-lottery-observe' }, () => {
  test.describe.configure({ mode: 'parallel' });

  test('renders the lottery stage and drafted students', async ({ adminPage }) => {
    const interventionsAggregateResponsePromise = adminPage.waitForResponse(
      response =>
        new URL(response.url()).pathname === '/dashboard/drafts/1/interventions-aggregate',
    );

    await adminPage.goto('/dashboard/drafts/1/');
    const interventionsTrigger = adminPage.getByRole('button', { name: /^Interventions$/u });
    await expect(interventionsTrigger).toBeVisible();
    await expect(interventionsTrigger).toHaveAttribute('aria-expanded', 'true');

    const interventionsAggregateResponse = await interventionsAggregateResponsePromise;
    expect(interventionsAggregateResponse.ok()).toBeTruthy();
    await expect(adminPage.locator('#quota-dumbbell-chart')).toBeVisible();
    await expectSheetContents(
      adminPage,
      'See Drafted',
      [/202012345/u, /202012346/u, /202012349/u, /202012348/u],
      [/202012350/u, /202012351/u],
    );
  });

  test('loads eligible students only after opening the sheet', async ({ adminPage }) => {
    await expectNoRequests(adminPage, '/dashboard/drafts/1/draftees', async () => {
      await adminPage.goto('/dashboard/drafts/1/');
      await openInterventions(adminPage);
      await expectVisibleButtons(adminPage, ['Show Eligible Students']);
    });

    const responsePromise = adminPage.waitForResponse(
      response => new URL(response.url()).pathname === '/dashboard/drafts/1/draftees',
    );
    await adminPage.getByRole('button', { name: 'Show Eligible Students' }).first().click();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
  });

  test('keeps the quota editor out of the eligible-students sheet', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/drafts/1/');
    await openInterventions(adminPage);
    await expect(adminPage.getByRole('button', { name: 'Edit Lottery Quota' })).toBeVisible();
    await adminPage.getByRole('button', { name: 'Edit Lottery Quota' }).click();
    const quotaSheet = adminPage.locator('[data-slot="sheet-content"]').last();
    await expect(quotaSheet).toBeVisible();
    await expect(quotaSheet.getByText('Update Draft Quota')).toBeVisible();
    await adminPage.keyboard.press('Escape');
    await expect(quotaSheet).toBeHidden();

    await adminPage.getByRole('button', { name: 'Show Eligible Students' }).click();
    const studentsSheet = adminPage.locator('[data-slot="sheet-content"]').last();
    await expect(studentsSheet).toBeVisible();
    await expect(studentsSheet.locator('#draft-quota-editor-lottery')).toHaveCount(0);
    await adminPage.keyboard.press('Escape');
    await expect(studentsSheet).toBeHidden();
  });

  test('shows faculty the lottery callout and previous selections', async ({ ndslHeadPage }) => {
    await expectStudentsCallout(
      ndslHeadPage,
      'The draft is now in the lottery stage. Kindly contact the draft administrators on how to proceed.',
      [],
      {
        title: 'Lottery Stage',
        banner:
          'has recently finished the main drafting process. It is currently in the lottery round.',
      },
    );
    await ndslHeadPage.goto('/dashboard/students/');
    await expectPreviousPicksTab(ndslHeadPage, 1, [
      /DRAFTEE, Eager/u,
      /202012345/u,
      /eager\.student@up\.edu\.ph/u,
    ]);
    await expectPreviousPicksTab(ndslHeadPage, 3, [
      /FULLRANKER, Unlucky/u,
      /202012348/u,
      /unlucky\.student@up\.edu\.ph/u,
    ]);
  });
});

test(
  'Intervene, run the lottery, review outcomes, and finalize',
  { tag: '@full-lifecycle-complete' },
  async ({ adminPage, lateRegistrantUserId, ndslHeadPage }) => {
    await test.step('rejects invalid changes, records an intervention, and persists lottery quotas', async () => {
      await test.step('reject mismatched lottery quotas', async () => {
        await adminPage.goto('/dashboard/drafts/1/');
        await openInterventions(adminPage);
        adminPage.once('dialog', async dialog => await dialog.accept());
        const responsePromise = adminPage.waitForResponse('/dashboard/drafts/1/?/conclude');
        await adminPage.getByRole('button', { name: 'Run Lottery' }).click();
        const response = await responsePromise;
        const { type, status } = await response.json();
        expect(type).toBe('failure');
        expect(status).toBe(403);
        await expect(adminPage.getByRole('button', { name: 'Run Lottery' })).toBeEnabled();
      });
      await test.step('reject a non-participant forged intervention', async () => {
        await adminPage.goto('/dashboard/drafts/1/');
        const status = await postInterventions(adminPage, 1, { [lateRegistrantUserId]: 'scl' });
        expect(status).toBe(400);
      });
      await test.step('assign the first eligible student manually', async () => {
        await adminPage.goto('/dashboard/drafts/1/');
        await openInterventions(adminPage);
        await adminPage.getByRole('button', { name: 'Show Eligible Students' }).first().click();
        const interventionForm = adminPage.locator('form[action*="intervene"]');
        await expect(interventionForm).toBeVisible();
        await interventionForm.locator('select').first().selectOption({ index: 1 });
        adminPage.once('dialog', async dialog => await dialog.accept());
        const responsePromise = adminPage.waitForResponse('/dashboard/drafts/1/?/intervene');
        await adminPage.getByRole('button', { name: 'Apply Interventions' }).click();
        const response = await responsePromise;
        const { type } = await response.json();
        expect(type).toBe('success');
      });
      await test.step('update and reload lottery quota snapshots', async () => {
        await adminPage.goto('/dashboard/drafts/1/');
        await openInterventions(adminPage);
        await adminPage.getByRole('button', { name: 'Edit Lottery Quota' }).click();
        const editor = adminPage.locator('#draft-quota-editor-lottery');
        await expect(editor).toBeVisible();
        const ndslInput = editor.locator('input[name="ndsl"]');
        await expect(ndslInput).toHaveValue('');
        await expect(ndslInput).toHaveAttribute('placeholder', '0');
        await editor.locator('input[name="scl"]').fill('1');
        await editor.locator('input[name="cvmil"]').fill('1');
        await editor.locator('input[name="acl"]').fill('1');
        const responsePromise = adminPage.waitForResponse('/dashboard/drafts/1/?/quota');
        await editor.getByRole('button', { name: 'Update Lottery Snapshots' }).click();
        const response = await responsePromise;
        const { type } = await response.json();
        expect(type).toBe('success');

        await adminPage.goto('/dashboard/drafts/1/');
        await openInterventions(adminPage);
        await adminPage.getByRole('button', { name: 'Edit Lottery Quota' }).click();
        const committedEditor = adminPage.locator('#draft-quota-editor-lottery');
        const aclInput = committedEditor.locator('input[name="acl"]');
        await expect(aclInput).toHaveValue('');
        await expect(aclInput).toHaveAttribute('placeholder', '1');
        const committedNdslInput = committedEditor.locator('input[name="ndsl"]');
        await expect(committedNdslInput).toHaveValue('');
        await expect(committedNdslInput).toHaveAttribute('placeholder', '0');
      });
    });
    await test.step('runs the lottery and exposes review results to administrators and faculty', async () => {
      await test.step('run the lottery', async () => await runLottery(adminPage, '1'));
      await test.step('show the review state without loading lottery aggregate data', async () => {
        await expectNoRequests(adminPage, '/dashboard/drafts/1/lottery-aggregate', async () => {
          await adminPage.goto('/dashboard/drafts/1/');
          await expect(adminPage.getByText(/Started .* · Review/u)).toBeVisible();
          await expect(adminPage.getByRole('heading', { name: 'Review Phase' })).toHaveCount(0);
          await expect(adminPage.getByRole('heading', { name: 'Lottery Phase' })).toHaveCount(0);
          await expect(adminPage.getByRole('button', { name: /^Review$/u })).toHaveCount(0);
          await expect(adminPage.getByRole('heading', { name: 'Summary' })).toBeVisible();
          await expect(adminPage.getByText('Per-Lab Lottery Outcome')).toBeVisible();
          await expect(adminPage.getByRole('button', { name: 'Finalize Draft' })).toBeVisible();
          await expect(adminPage.getByRole('button', { name: 'View Undrafted' })).toHaveCount(0);
        });
      });
      await test.step('show lottery-only assignments in the review sheet', async () => {
        const outcomeCard = adminPage
          .getByText('Per-Lab Lottery Outcome')
          .locator('xpath=ancestor::*[@data-slot="card"]');
        await outcomeCard.getByRole('button', { name: 'View Results' }).click();
        const sheet = adminPage.locator('[data-slot="sheet-content"]').last();
        await expect(sheet.getByRole('heading', { name: 'Lottery Results' })).toBeVisible();
        await expect(sheet.getByText('Student Number')).toBeVisible();
        await expect(sheet.getByRole('columnheader', { name: 'Assigned Lab' })).toBeVisible();
        await expect(sheet.locator('tbody tr')).toHaveCount(3);
        await expect(sheet).toContainText('STUDENT, NoRank');
        await expect(sheet).toContainText('TOLOTTERY, Partial');
        await expect(sheet).not.toContainText('BYSTANDER, Idle');
        await expect(sheet).not.toContainText('Regular Drafted');
        await expect(sheet).not.toContainText('Intervention Drafted');
      });
      await test.step('show faculty the review state and their previous selections', async () => {
        await expectStudentsCallout(
          ndslHeadPage,
          'The draft is now in review. Lottery assignment has already run, and draft administrators are validating results before finalization.',
          [],
          {
            title: 'Draft Under Review',
            banner:
              'has completed lottery assignment and is now under review by the draft administrators.',
          },
        );
        await ndslHeadPage.goto('/dashboard/students/');
        await expectPreviousPicksTab(ndslHeadPage, 1, [
          /DRAFTEE, Eager/u,
          /202012345/u,
          /eager\.student@up\.edu\.ph/u,
        ]);
        await expectPreviousPicksTab(ndslHeadPage, 3, [
          /FULLRANKER, Unlucky/u,
          /202012348/u,
          /unlucky\.student@up\.edu\.ph/u,
        ]);
      });
    });
    await test.step('finalizes the draft', async () => {
      await finalizeDraft(adminPage, '1');
    });
  },
);
