import { openInterventions, openRegularRounds } from '$tests/actions/draft';
import {
  expectNoPreviousPicks,
  expectPreviousPicksTab,
  expectStatCards,
  expectStudentsCallout,
  expectVisibleButtons,
  submitFacultySelection,
} from '$tests/actions/faculty';
import { draftYearPattern, getHistoryDraft, getHistoryTimelineTexts } from '$tests/actions/history';
import { expectNoRequests } from '$tests/actions/network';
import { expectDrawerContents } from '$tests/actions/overlays';
import { postFacultyRankings } from '$tests/actions/server';
import { test } from '$tests/fixtures/users';
import { expect, type Page } from '@playwright/test';

function getRegularStudentsPanel(page: Page) {
  return page.getByRole('tabpanel', { name: 'Registered Students' });
}

function getRegularStudentsViewTrigger(page: Page) {
  return getRegularStudentsPanel(page)
    .getByRole('button', { name: /Pending Selection|Already Drafted/u })
    .first();
}

async function expectRegularStudentsViewOptions(
  page: Page,
  currentView: 'Pending Selection' | 'Already Drafted',
) {
  const trigger = getRegularStudentsViewTrigger(page);
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveText(currentView);

  await trigger.click();
  await expect(page.getByRole('menuitem', { name: 'Pending Selection' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Already Drafted' })).toBeVisible();
  await page.keyboard.press('Escape');
}

async function selectRegularStudentsView(
  page: Page,
  view: 'Pending Selection' | 'Already Drafted',
) {
  await page.getByRole('tab', { name: 'Registered Students' }).click();
  await expect(getRegularStudentsPanel(page)).toBeVisible();

  const trigger = getRegularStudentsViewTrigger(page);
  await expect(trigger).toBeVisible();

  const triggerText = await trigger.textContent();
  if (triggerText?.trim() === view) return;

  await trigger.click();
  await page.getByRole('menuitem', { name: view }).click();
  await expect(trigger).toHaveText(view);
}

async function expectRegularStudentsContents(
  page: Page,
  view: 'Pending Selection' | 'Already Drafted',
  expectedVisible: readonly (string | RegExp)[],
  expectedHidden: readonly (string | RegExp)[] = [],
) {
  await selectRegularStudentsView(page, view);

  const panel = getRegularStudentsPanel(page);
  await expect(panel).toBeVisible();

  for (const value of expectedVisible) await expect(panel).toContainText(value);
  for (const value of expectedHidden) await expect(panel).not.toContainText(value);
}

test.describe(
  'Primary Draft Round 1 Observation',
  { tag: '@full-lifecycle-round-1-observe' },
  () => {
    test('admin regular-round view provides loaders, views, and distribution', async ({
      adminPage,
    }) => {
      const assignmentSummaryResponsePromise = adminPage.waitForResponse(
        response => new URL(response.url()).pathname === '/dashboard/drafts/1/assignment-summary',
      );

      await adminPage.goto('/dashboard/drafts/1/');
      const regularRoundsTrigger = adminPage.getByRole('button', { name: /Regular Rounds/u });
      await expect(regularRoundsTrigger).toBeVisible();
      await expect(regularRoundsTrigger).toHaveAttribute('aria-expanded', 'true');

      const response = await assignmentSummaryResponsePromise;
      expect(response.ok()).toBeTruthy();
      await expect(adminPage.locator('#regular-round-summary-chart')).toBeVisible();

      await adminPage.getByRole('tab', { name: 'Registered Students' }).click();
      await expect(adminPage.getByRole('tabpanel', { name: 'Registered Students' })).toBeVisible();
      await expectRegularStudentsViewOptions(adminPage, 'Pending Selection');
      await selectRegularStudentsView(adminPage, 'Already Drafted');
      await expectRegularStudentsViewOptions(adminPage, 'Already Drafted');

      await adminPage.getByRole('tab', { name: 'Lab Distributions' }).click();
      await expect(adminPage.locator('#regular-round-summary-chart')).toBeVisible();
    });

    test('pending selection loads only when its tab opens', async ({ adminPage }) => {
      await expectNoRequests(adminPage, '/dashboard/drafts/1/draftees', async () => {
        await adminPage.goto('/dashboard/drafts/1/');
        await openRegularRounds(adminPage);
      });
      const initialResponsePromise = adminPage.waitForResponse(
        response => new URL(response.url()).pathname === '/dashboard/drafts/1/draftees',
      );
      await adminPage.getByRole('tab', { name: 'Registered Students' }).click();
      await expect(adminPage.getByRole('tabpanel', { name: 'Registered Students' })).toBeVisible();
      await initialResponsePromise;
      await expectRegularStudentsViewOptions(adminPage, 'Pending Selection');
    });

    test('system logs drawer describes regular-round automation', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await openRegularRounds(adminPage);
      await expectDrawerContents(adminPage, 'View System Logs', [
        /System Logs/u,
        /Show System Automation Logs/u,
      ]);
    });

    test('undrafted drawer requires a selected lab', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await openRegularRounds(adminPage);
      await expectDrawerContents(adminPage, 'View Undrafted', [
        /Undrafted Students/u,
        /Select at least one lab to view students\./u,
      ]);
    });

    test('registered-student view changes use the initial data load', async ({ adminPage }) => {
      const initialResponsePromise = adminPage.waitForResponse(
        response => new URL(response.url()).pathname === '/dashboard/drafts/1/draftees',
      );

      await adminPage.goto('/dashboard/drafts/1/');
      await openRegularRounds(adminPage);
      await adminPage.getByRole('tab', { name: 'Registered Students' }).click();
      await expect(adminPage.getByRole('tabpanel', { name: 'Registered Students' })).toBeVisible();
      await initialResponsePromise;

      await test.step('switching to already drafted does not fetch again', async () => {
        await expectNoRequests(adminPage, '/dashboard/drafts/1/draftees', async () => {
          await selectRegularStudentsView(adminPage, 'Already Drafted');
        });
      });

      await test.step('switching back to pending selection does not fetch again', async () => {
        await expectNoRequests(adminPage, '/dashboard/drafts/1/draftees', async () => {
          await selectRegularStudentsView(adminPage, 'Pending Selection');
        });
      });
    });

    test('NDSL starts round 1 with its available candidates and empty selection', async ({
      ndslHeadPage,
    }) => {
      await ndslHeadPage.goto('/dashboard/students/');
      await expectStatCards(ndslHeadPage, { quota: 2, remaining: 2, drafted: 0 });
      await expectNoPreviousPicks(ndslHeadPage);
      await expect(ndslHeadPage.locator('#selection-progress')).toContainText('0/2 Slots');
      await expect(ndslHeadPage.getByRole('button', { name: 'Submit Selection' })).toBeVisible();
      await expect(ndslHeadPage.getByRole('button', { name: /Eager/u })).toBeVisible();
      await expect(ndslHeadPage.getByRole('button', { name: /Partial/u })).toBeVisible();
    });

    test('CSL starts round 1 with an empty selection', async ({ cslHeadPage }) => {
      await cslHeadPage.goto('/dashboard/students/');
      await expectStatCards(cslHeadPage, { quota: 2, remaining: 2, drafted: 0 });
      await expectNoPreviousPicks(cslHeadPage);
    });

    test('SCL starts round 1 with an empty selection', async ({ sclHeadPage }) => {
      await sclHeadPage.goto('/dashboard/students/');
      await expectStatCards(sclHeadPage, { quota: 2, remaining: 2, drafted: 0 });
      await expectNoPreviousPicks(sclHeadPage);
    });

    test('CVMIL is auto-acknowledged when no student prefers it', async ({ cvmilHeadPage }) => {
      await cvmilHeadPage.goto('/dashboard/students/');
      await expectStatCards(cvmilHeadPage, { quota: 1, remaining: 1, drafted: 0 });
      await expectStudentsCallout(
        cvmilHeadPage,
        'No undrafted students have selected this lab in this round.',
        ['This lab has no more draft slots remaining for the rest of this draft.'],
        { title: 'No Student Preferences This Round' },
      );

      await cvmilHeadPage.goto('/dashboard/students/');
      const status = await postFacultyRankings(cvmilHeadPage, 1, 1);
      expect(status).toBe(409);
    });

    test('ACL starts round 1 with an empty selection', async ({ aclHeadPage }) => {
      await aclHeadPage.goto('/dashboard/students/');
      await expectStatCards(aclHeadPage, { quota: 1, remaining: 1, drafted: 0 });
      await expectNoPreviousPicks(aclHeadPage);
    });
  },
);

test.describe('Primary Draft Round 1 Selection', { tag: '@full-lifecycle-round-1-select' }, () => {
  test.describe.configure({ mode: 'parallel' });

  test('NDSL can amend, clear, restore, and idempotently preserve its round-1 selection', async ({
    ndslHeadPage,
  }) => {
    await ndslHeadPage.goto('/dashboard/students/');

    await test.step('selects Eager', async () => {
      await ndslHeadPage.getByRole('button', { name: /Eager/u }).click();
      await expect(ndslHeadPage.locator('li[data-selected="true"]')).toHaveCount(1);
      await expect(ndslHeadPage.locator('li[data-selected="true"]')).toContainText(/Eager/u);
      await expect(ndslHeadPage.locator('#selection-progress')).toHaveText(/1\/2 Slots/u);
      await submitFacultySelection(ndslHeadPage, 'Submit Selection');
      await expect(ndslHeadPage.getByRole('button', { name: 'Update Selection' })).toBeVisible();
      await ndslHeadPage.goto('/dashboard/students/');
      await expectStatCards(ndslHeadPage, { quota: 2, remaining: 1, drafted: 1 });
    });

    await test.step('amends Eager to Partial', async () => {
      await expect(ndslHeadPage.getByRole('button', { name: /Eager/u })).toBeVisible();
      await expect(ndslHeadPage.getByRole('button', { name: /Partial/u })).toBeVisible();
      await ndslHeadPage.getByRole('button', { name: /Eager/u }).click();
      await ndslHeadPage.getByRole('button', { name: /Partial/u }).click();
      await submitFacultySelection(ndslHeadPage, 'Update Selection');
      await expect(ndslHeadPage.getByRole('button', { name: 'Update Selection' })).toBeVisible();
    });

    await test.step('discards an unsaved edit on reload', async () => {
      await ndslHeadPage.goto('/dashboard/students/');
      await ndslHeadPage.getByRole('button', { name: /Eager/u }).click();
      await ndslHeadPage.goto('/dashboard/students/');
      await expect(ndslHeadPage.getByRole('button', { name: 'Update Selection' })).toBeVisible();
      await expectPreviousPicksTab(ndslHeadPage, 1, [/Partial/u]);
      await expect(ndslHeadPage.locator('#selection-progress')).toContainText('1/');
    });

    await test.step('can save an empty selection', async () => {
      await ndslHeadPage.getByRole('button', { name: /Partial/u }).click();
      await expect(ndslHeadPage.locator('#selection-progress')).toContainText('0/');
      await submitFacultySelection(ndslHeadPage, 'Update Selection');
      await expect(ndslHeadPage.getByRole('button', { name: 'Update Selection' })).toBeVisible();
      await ndslHeadPage.goto('/dashboard/students/');
      await expectStatCards(ndslHeadPage, { quota: 2, remaining: 2, drafted: 0 });
    });

    await test.step('can restore Eager after an empty edit', async () => {
      await ndslHeadPage.getByRole('button', { name: /Eager/u }).click();
      await submitFacultySelection(ndslHeadPage, 'Update Selection');
      await ndslHeadPage.goto('/dashboard/students/');
      await expectStatCards(ndslHeadPage, { quota: 2, remaining: 1, drafted: 1 });
    });

    await test.step('can amend multiple times in the active round', async () => {
      await ndslHeadPage.goto('/dashboard/students/');
      await ndslHeadPage.getByRole('button', { name: /Eager/u }).click();
      await ndslHeadPage.getByRole('button', { name: /Partial/u }).click();
      await submitFacultySelection(ndslHeadPage, 'Update Selection');
      await expectPreviousPicksTab(ndslHeadPage, 1, [/Partial/u]);

      await ndslHeadPage.getByRole('button', { name: /Partial/u }).click();
      await ndslHeadPage.getByRole('button', { name: /Eager/u }).click();
      await submitFacultySelection(ndslHeadPage, 'Update Selection');
      await expectPreviousPicksTab(ndslHeadPage, 1, [/Eager/u]);
    });

    await test.step('preserves the selection on an idempotent update', async () => {
      await ndslHeadPage.goto('/dashboard/students/');
      await expect(ndslHeadPage.getByRole('button', { name: 'Update Selection' })).toBeVisible();
      await expect(ndslHeadPage.locator('#selection-progress')).toContainText('1/');
      await submitFacultySelection(ndslHeadPage, 'Update Selection');
      await expectPreviousPicksTab(ndslHeadPage, 1, [/Eager/u]);
      await expectStatCards(ndslHeadPage, { quota: 2, remaining: 1, drafted: 1 });
    });
  });

  test('CSL can select and successfully re-submit its sole round-1 preferrer', async ({
    cslHeadPage,
  }) => {
    await cslHeadPage.goto('/dashboard/students/');

    await test.step('selects Patient', async () => {
      await cslHeadPage.getByRole('button', { name: /Patient/u }).click();
      await submitFacultySelection(cslHeadPage, 'Submit Selection');
      await expect(cslHeadPage.getByRole('button', { name: 'Update Selection' })).toBeVisible();
      await cslHeadPage.goto('/dashboard/students/');
      await expectStatCards(cslHeadPage, { quota: 2, remaining: 1, drafted: 1 });
    });

    await test.step('re-submits Patient successfully', async () => {
      cslHeadPage.once('dialog', async dialog => await dialog.accept());
      const responsePromise = cslHeadPage.waitForResponse('/dashboard/students/?/rankings');
      await cslHeadPage.getByRole('button', { name: 'Update Selection' }).click();
      const response = await responsePromise;
      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData).toMatchObject({ type: 'success' });
      await cslHeadPage.goto('/dashboard/students/');
      await expect(cslHeadPage.getByRole('button', { name: 'Update Selection' })).toBeVisible();
      await expectStatCards(cslHeadPage, { quota: 2, remaining: 1, drafted: 1 });
    });
  });

  test('SCL can skip its round-1 candidates without consuming quota', async ({ sclHeadPage }) => {
    await sclHeadPage.goto('/dashboard/students/');
    await expect(sclHeadPage.getByRole('button', { name: /Persistent/u })).toBeVisible();
    await submitFacultySelection(sclHeadPage, 'Submit Selection');
    await expect(sclHeadPage.getByRole('button', { name: 'Update Selection' })).toBeVisible();
    await sclHeadPage.goto('/dashboard/students/');
    await expectStatCards(sclHeadPage, { quota: 2, remaining: 2, drafted: 0 });
  });
});

test.describe(
  'Primary Draft Round 1 Advancement',
  { tag: '@full-lifecycle-round-1-advance' },
  () => {
    test('rejects CSL’s stale edit after ACL advances the round', async ({
      cslHeadPage,
      aclHeadPage,
    }) => {
      await test.step('CSL loads its editable selection', async () => {
        await cslHeadPage.goto('/dashboard/students/');
        await expect(cslHeadPage.getByRole('button', { name: 'Update Selection' })).toBeVisible();
      });

      await test.step('ACL makes the final round-1 submission', async () => {
        await aclHeadPage.goto('/dashboard/students/');
        await expect(aclHeadPage.getByRole('button', { name: /Unlucky/u })).toBeVisible();
        await submitFacultySelection(aclHeadPage, 'Submit Selection');
      });

      await test.step('CSL’s stale update returns the round-advance failure', async () => {
        cslHeadPage.once('dialog', async dialog => await dialog.accept());
        const responsePromise = cslHeadPage.waitForResponse('/dashboard/students/?/rankings');
        await cslHeadPage.getByRole('button', { name: 'Update Selection' }).click();
        const response = await responsePromise;
        expect(response.status()).toBe(200);
        const responseData = await response.json();
        expect(responseData).toMatchObject({ type: 'failure', status: 409 });
        await expect(cslHeadPage.getByText('Round advanced while editing')).toBeVisible();
      });

      await test.step('ACL remains unchanged after the stale edit is rejected', async () => {
        await aclHeadPage.goto('/dashboard/students/');
        await expectStatCards(aclHeadPage, { quota: 1, remaining: 1, drafted: 0 });
      });
    });
  },
);

test.describe(
  'Primary Draft Round 2 Observation',
  { tag: '@full-lifecycle-round-2-observe' },
  () => {
    test('admin view reflects round 2 assignments and pending students', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await expect(adminPage.getByText(/Round 2/u).first()).toBeVisible();
      await openRegularRounds(adminPage);
      await expectRegularStudentsContents(
        adminPage,
        'Already Drafted',
        [/202012345/u, /202012346/u],
        [/202012349/u, /202012348/u],
      );
      await expectRegularStudentsContents(
        adminPage,
        'Pending Selection',
        [/202012349/u, /202012348/u, /202012350/u],
        [/202012345/u, /202012346/u],
      );
    });

    test.describe('server rejects invalid round-2 selections', () => {
      test.describe.configure({ mode: 'serial' });

      test('rejects every invalid selection category without mutating the round', async ({
        ndslHeadPage,
        persistentHopefulUserId,
        unluckyFullRankerUserId,
        patientCandidateUserId,
        idleBystanderUserId,
        eagerDrafteeUserId,
      }) => {
        await ndslHeadPage.goto('/dashboard/students/');

        await test.step('rejects a fabricated student id', async () => {
          const status = await postFacultyRankings(ndslHeadPage, 1, 2, [
            'nonexistent-user-id-12345',
          ]);
          expect(status).toBe(409);
        });
        await test.step('rejects a student who chose another lab', async () => {
          const status = await postFacultyRankings(ndslHeadPage, 1, 2, [persistentHopefulUserId]);
          expect(status).toBe(409);
        });
        await test.step('rejects a preference from another round', async () => {
          const status = await postFacultyRankings(ndslHeadPage, 1, 2, [unluckyFullRankerUserId]);
          expect(status).toBe(409);
        });
        await test.step('rejects an already drafted student', async () => {
          const status = await postFacultyRankings(ndslHeadPage, 1, 2, [patientCandidateUserId]);
          expect(status).toBe(409);
        });
        await test.step('rejects a student without rankings', async () => {
          const status = await postFacultyRankings(ndslHeadPage, 1, 2, [idleBystanderUserId]);
          expect(status).toBe(409);
        });
        await test.step('rejects a mixed valid and invalid batch', async () => {
          const status = await postFacultyRankings(ndslHeadPage, 1, 2, [
            persistentHopefulUserId,
            eagerDrafteeUserId,
          ]);
          expect(status).toBe(409);
        });
        await test.step('NDSL keeps its automatic acknowledgement and previous pick after rejected changes', async () => {
          await expectStudentsCallout(
            ndslHeadPage,
            'No undrafted students have selected this lab in this round.',
            ['This lab has no more draft slots remaining for the rest of this draft.'],
            { title: 'No Student Preferences This Round' },
          );
          await ndslHeadPage.goto('/dashboard/students/');
          const status = await postFacultyRankings(ndslHeadPage, 1, 2);
          expect(status).toBe(409);
          await expectStatCards(ndslHeadPage, { quota: 2, remaining: 1, drafted: 1 });
          await expectPreviousPicksTab(ndslHeadPage, 1, [
            /DRAFTEE, Eager/u,
            /202012345/u,
            /eager\.student@up\.edu\.ph/u,
          ]);
        });
      });
    });

    test('SCL is auto-acknowledged in round 2 without consuming quota', async ({ sclHeadPage }) => {
      await expectStudentsCallout(
        sclHeadPage,
        'No undrafted students have selected this lab in this round.',
        ['This lab has no more draft slots remaining for the rest of this draft.'],
        { title: 'No Student Preferences This Round' },
      );
      await sclHeadPage.goto('/dashboard/students/');
      await expectStatCards(sclHeadPage, { quota: 2, remaining: 2, drafted: 0 });
    });

    test('ACL is auto-acknowledged in round 2 without consuming quota', async ({ aclHeadPage }) => {
      await expectStudentsCallout(
        aclHeadPage,
        'No undrafted students have selected this lab in this round.',
        ['This lab has no more draft slots remaining for the rest of this draft.'],
        { title: 'No Student Preferences This Round' },
      );
      await aclHeadPage.goto('/dashboard/students/');
      await expectStatCards(aclHeadPage, { quota: 1, remaining: 1, drafted: 0 });
    });

    test('CSL begins round 2 with Patient as its previous pick', async ({ cslHeadPage }) => {
      await cslHeadPage.goto('/dashboard/students/');
      await expectStatCards(cslHeadPage, { quota: 2, remaining: 1, drafted: 1 });
      await expect(cslHeadPage.locator('#selection-progress')).toContainText('0/1 Slots');
      await expectPreviousPicksTab(cslHeadPage, 1, [
        /CANDIDATE, Patient/u,
        /202012346/u,
        /patient\.student@up\.edu\.ph/u,
      ]);
    });
  },
);

test.describe('Primary Draft Round 2 Selection', { tag: '@full-lifecycle-round-2-select' }, () => {
  test('CSL completes its selection before CVMIL advances the draft', async ({
    cslHeadPage,
    cvmilHeadPage,
  }) => {
    await test.step('CSL selects PartialToDrafted', async () => {
      await cslHeadPage.goto('/dashboard/students/');
      await expect(cslHeadPage.getByRole('button', { name: /Partial/u })).toBeVisible();
      await cslHeadPage.getByRole('button', { name: /Partial/u }).click();
      await expect(cslHeadPage.locator('li[data-selected="true"]')).toHaveCount(1);
      await expect(cslHeadPage.locator('li[data-selected="true"]')).toContainText(/Partial/u);
      await expect(cslHeadPage.locator('#selection-progress')).toHaveText(/1\/1 Slots/u);
      await submitFacultySelection(cslHeadPage, 'Submit Selection');
      await expectStudentsCallout(
        cslHeadPage,
        'This lab has no more draft slots remaining for the rest of this draft.',
      );
      await expectPreviousPicksTab(cslHeadPage, 2, [/Partial/u]);
    });

    await test.step('CVMIL skips its eligible candidates', async () => {
      await cvmilHeadPage.goto('/dashboard/students/');
      await expectStatCards(cvmilHeadPage, { quota: 1, remaining: 1, drafted: 0 });
      await expectNoPreviousPicks(cvmilHeadPage);
      await expect(cvmilHeadPage.getByRole('button', { name: /Persistent/u })).toBeVisible();
      await expect(cvmilHeadPage.getByRole('button', { name: /Unlucky/u })).toBeVisible();
      await submitFacultySelection(cvmilHeadPage, 'Submit Selection');
      await expectStudentsCallout(
        cvmilHeadPage,
        'No undrafted students have selected this lab in this round.',
        ['This lab has no more draft slots remaining for the rest of this draft.'],
      );
    });
  });
});

test.describe(
  'Primary Draft Round 3 Observation',
  { tag: '@full-lifecycle-round-3-observe' },
  () => {
    test('admin view reflects round 3 assignments', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await expect(adminPage.getByText(/Round 3/u).first()).toBeVisible();
      await openRegularRounds(adminPage);
      await expectRegularStudentsContents(
        adminPage,
        'Already Drafted',
        [/202012345/u, /202012346/u, /202012349/u],
        [/202012348/u, /202012350/u],
      );
    });

    test('CSL is quota-exhausted and rejects forced round-3 updates', async ({ cslHeadPage }) => {
      await expectStudentsCallout(
        cslHeadPage,
        'This lab has no more draft slots remaining for the rest of this draft.',
        ['No undrafted students have selected this lab in this round.'],
        { title: 'No Slots Remaining' },
      );
      await cslHeadPage.goto('/dashboard/students/');
      const status = await postFacultyRankings(cslHeadPage, 1, 3);
      expect(status).toBe(409);
      await expectStatCards(cslHeadPage, { quota: 2, remaining: 0, drafted: 2 });
      await expectPreviousPicksTab(cslHeadPage, 1, [
        /CANDIDATE, Patient/u,
        /202012346/u,
        /patient\.student@up\.edu\.ph/u,
      ]);
      await expectPreviousPicksTab(cslHeadPage, 2, [
        /TODRAFTED, Partial/u,
        /202012349/u,
        /partial-drafted\.student@up\.edu\.ph/u,
      ]);
    });

    test('SCL is auto-acknowledged in round 3 without consuming quota', async ({ sclHeadPage }) => {
      await expectStudentsCallout(
        sclHeadPage,
        'No undrafted students have selected this lab in this round.',
        ['This lab has no more draft slots remaining for the rest of this draft.'],
        { title: 'No Student Preferences This Round' },
      );
      await sclHeadPage.goto('/dashboard/students/');
      await expectStatCards(sclHeadPage, { quota: 2, remaining: 2, drafted: 0 });
    });

    test('CVMIL is auto-acknowledged in round 3 without consuming quota', async ({
      cvmilHeadPage,
    }) => {
      await expectStudentsCallout(
        cvmilHeadPage,
        'No undrafted students have selected this lab in this round.',
        ['This lab has no more draft slots remaining for the rest of this draft.'],
        { title: 'No Student Preferences This Round' },
      );
      await cvmilHeadPage.goto('/dashboard/students/');
      await expectStatCards(cvmilHeadPage, { quota: 1, remaining: 1, drafted: 0 });
    });
  },
);

test.describe('Primary Draft Round 3 Selection', { tag: '@full-lifecycle-round-3-select' }, () => {
  test('NDSL completes round 3 before ACL advances the draft to lottery', async ({
    ndslHeadPage,
    aclHeadPage,
  }) => {
    await test.step('NDSL selects Unlucky', async () => {
      await ndslHeadPage.goto('/dashboard/students/');
      await expectStatCards(ndslHeadPage, { quota: 2, remaining: 1, drafted: 1 });
      await expect(ndslHeadPage.locator('#selection-progress')).toContainText('0/1 Slots');
      await expectPreviousPicksTab(ndslHeadPage, 1, [
        /DRAFTEE, Eager/u,
        /202012345/u,
        /eager\.student@up\.edu\.ph/u,
      ]);
      await expect(ndslHeadPage.getByRole('button', { name: /Unlucky/u })).toBeVisible();
      await ndslHeadPage.getByRole('button', { name: /Unlucky/u }).click();
      await expect(ndslHeadPage.locator('li[data-selected="true"]')).toHaveCount(1);
      await expect(ndslHeadPage.locator('li[data-selected="true"]')).toContainText(/Unlucky/u);
      await expect(ndslHeadPage.locator('#selection-progress')).toHaveText(/1\/1 Slots/u);
      await submitFacultySelection(ndslHeadPage, 'Submit Selection');
      await expectStudentsCallout(
        ndslHeadPage,
        'This lab has no more draft slots remaining for the rest of this draft.',
      );
      await expectPreviousPicksTab(ndslHeadPage, 3, [/Unlucky/u]);
    });

    await test.step('ACL skips Persistent and enters lottery', async () => {
      await aclHeadPage.goto('/dashboard/students/');
      await expectStatCards(aclHeadPage, { quota: 1, remaining: 1, drafted: 0 });
      await expectNoPreviousPicks(aclHeadPage);
      await expect(aclHeadPage.getByRole('button', { name: /Persistent/u })).toBeVisible();
      await submitFacultySelection(aclHeadPage, 'Submit Selection');
      await expectStudentsCallout(
        aclHeadPage,
        'The draft is now in the lottery stage. Kindly contact the draft administrators on how to proceed.',
      );
    });
  });
});

test.describe('Primary Draft Lottery History', { tag: '@full-lifecycle-lottery-observe' }, () => {
  test.describe.configure({ mode: 'parallel' });

  test('history shows the draft year and lottery stage', async ({ page }) => {
    await page.goto('/history/');
    await expect(getHistoryDraft(page, '1')).toContainText(draftYearPattern);
    await expect(page.getByText(/lottery stage/u)).toBeVisible();
  });

  test('admin lottery view exposes interventions and regular-round history', async ({
    adminPage,
  }) => {
    await adminPage.goto('/dashboard/drafts/1/');
    await expect(
      adminPage.getByRole('heading', { name: 'Interventions', exact: true }),
    ).toBeVisible();
    await openInterventions(adminPage);
    await expectVisibleButtons(adminPage, ['Show Eligible Students', 'See Drafted']);
    await expect(adminPage.getByRole('button', { name: 'Run Lottery' })).toBeVisible();

    await openRegularRounds(adminPage);
    await expect(adminPage.getByRole('tab', { name: 'Registered Students' })).toBeVisible();
    await expect(adminPage.getByRole('button', { name: 'View Undrafted' })).toHaveCount(0);

    await openInterventions(adminPage);
    await adminPage.getByRole('button', { name: 'Show Eligible Students' }).first().click();
    await expect(adminPage.getByRole('button', { name: 'Apply Interventions' })).toBeVisible();
  });

  test('history orders round events and records every automatic skip', async ({ page }) => {
    const texts = await getHistoryTimelineTexts(page, 1);
    await expect(page.getByText('lottery stage')).toBeVisible();

    function indexOf(pattern: RegExp) {
      return texts.findIndex(text => pattern.test(text));
    }
    expect(indexOf(/was finalized/u)).toBe(-1);

    const anyRound3Batch = indexOf(/3rd batch/iu);
    const anyRound2Batch = indexOf(/2nd batch/iu);
    const anyRound1Batch = indexOf(/1st batch/iu);
    expect(anyRound3Batch).toBeGreaterThanOrEqual(0);
    expect(anyRound2Batch).toBeGreaterThanOrEqual(0);
    expect(anyRound1Batch).toBeGreaterThanOrEqual(0);
    expect(anyRound3Batch).toBeLessThan(anyRound2Batch);
    expect(anyRound2Batch).toBeLessThan(anyRound1Batch);

    const skipEntries = texts.filter(text => /system has skipped/iu.test(text));
    expect(skipEntries).toHaveLength(7);
    expect(
      skipEntries.some(text => /system has skipped the CVMIL for the 1st round/iu.test(text)),
    ).toBe(true);
    expect(
      skipEntries.some(text => /system has skipped the NDSL for the 2nd round/iu.test(text)),
    ).toBe(true);
    expect(
      skipEntries.some(text => /system has skipped the SCL for the 2nd round/iu.test(text)),
    ).toBe(true);
    expect(
      skipEntries.some(text => /system has skipped the ACL for the 2nd round/iu.test(text)),
    ).toBe(true);
    expect(
      skipEntries.some(text => /system has skipped the CSL for the 3rd round/iu.test(text)),
    ).toBe(true);
    expect(
      skipEntries.some(text => /system has skipped the SCL for the 3rd round/iu.test(text)),
    ).toBe(true);
    expect(
      skipEntries.some(text => /system has skipped the CVMIL for the 3rd round/iu.test(text)),
    ).toBe(true);
    expect(
      skipEntries.some(text => /system has skipped the NDSL for the 1st round/iu.test(text)),
    ).toBe(false);
    expect(indexOf(/was created/u)).toBe(texts.length - 1);
  });
});
