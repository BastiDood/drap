import { addDays, subDays } from 'date-fns';
import { expect, type Locator, type Page } from '@playwright/test';

import { test } from './fixtures/users';

async function assertLogout(page: Page) {
  await page.goto('/dashboard/');
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('heading', { name: 'Draft Ranking Automated Processor' }),
  ).toBeVisible();
}

function getDraftAdminRow(card: Locator, email: string) {
  return card.getByRole('link', { name: email }).locator('xpath=ancestor::li[1]');
}

async function expectStatCards(
  page: Page,
  expected: { quota: number; remaining: number; drafted: number },
) {
  await expect(page.locator('#stat-total-quota')).toHaveText(String(expected.quota));
  await expect(page.locator('#stat-remaining')).toHaveText(String(expected.remaining));
  await expect(page.locator('#stat-drafted')).toHaveText(String(expected.drafted));
}

async function expectPreviousPicksTab(page: Page, round: number, studentNames: RegExp[]) {
  const panel = page.locator('#previous-picks');
  await expect(panel).toBeVisible();
  const tab = panel.getByRole('tab', { name: `Round ${round}` });
  await expect(tab).toBeVisible();
  await tab.click();
  const activeContent = panel.locator('[data-state="active"][data-slot="tabs-content"]');
  for (const name of studentNames) await expect(activeContent).toContainText(name);
}

async function expectNoPreviousPicks(page: Page) {
  await expect(page.locator('#previous-picks')).toHaveCount(0);
}

async function expectStudentsCallout(
  page: Page,
  expected: string | RegExp,
  forbidden: (string | RegExp)[] = [],
  options: {
    title?: string | RegExp;
    banner?: string | RegExp;
  } = {},
) {
  await page.goto('/dashboard/students/');
  const emptyState = page.locator('[data-slot="empty"]');
  await expect(emptyState).toBeVisible();
  if (typeof options.title !== 'undefined') await expect(emptyState).toContainText(options.title);
  await expect(emptyState).toContainText(expected);
  for (const matcher of forbidden) await expect(emptyState).not.toContainText(matcher);
  if (typeof options.banner !== 'undefined') {
    const statusBanner = page.getByRole('alert');
    await expect(statusBanner).toHaveAttribute('data-variant', 'info');
    await expect(statusBanner).toContainText(options.banner);
  }

  await expect(page.locator('form[action="/dashboard/students/?/rankings"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Submit Selection' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Update Selection' })).toHaveCount(0);
}

async function getHistoryTimelineTexts(page: Page, draftId: number) {
  await page.goto(`/history/${draftId}/`);
  const rows = page.locator('section > ol.border-s > li.ms-6 ol.space-y-1 > li');
  const textContents = await rows.allTextContents();
  return textContents.map(text => text.replaceAll(/\s+/gu, ' ').trim());
}

async function postFacultyRankings(
  page: Page,
  draft: number,
  round: number,
  students: string[] = [],
) {
  return await page.evaluate(
    async ({ draft, round, students }) => {
      const data = new FormData();
      data.set('draft', String(draft));
      data.set('round', String(round));
      for (const student of students) data.append('students', student);

      const response = await fetch('/dashboard/students/?/rankings', {
        method: 'POST',
        body: data,
      });

      return response.status;
    },
    { draft, round, students },
  );
}

async function expectVisibleButtons(page: Page, labels: string[]) {
  for (const label of labels)
    await expect(page.getByRole('button', { name: label }).first()).toBeVisible();
}

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

  if ((await trigger.textContent())?.trim() === view) return;

  await trigger.click();
  await page.getByRole('menuitem', { name: view }).click();
  await expect(trigger).toHaveText(view);
}

async function expectRegularStudentsContents(
  page: Page,
  view: 'Pending Selection' | 'Already Drafted',
  expectedVisible: (string | RegExp)[],
  expectedHidden: (string | RegExp)[] = [],
) {
  await selectRegularStudentsView(page, view);

  const panel = getRegularStudentsPanel(page);
  await expect(panel).toBeVisible();

  for (const value of expectedVisible) await expect(panel).toContainText(value);
  for (const value of expectedHidden) await expect(panel).not.toContainText(value);
}

async function expectSheetContents(
  page: Page,
  triggerName: string,
  expectedVisible: (string | RegExp)[],
  expectedHidden: (string | RegExp)[] = [],
) {
  await page.getByRole('button', { name: triggerName }).first().click();

  const sheet = page.locator('[data-slot="sheet-content"]').last();
  await expect(sheet).toBeVisible();

  for (const value of expectedVisible) await expect(sheet).toContainText(value);
  for (const value of expectedHidden) await expect(sheet).not.toContainText(value);

  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
}

async function expectDrawerContents(
  page: Page,
  triggerName: string,
  expectedVisible: (string | RegExp)[],
  expectedHidden: (string | RegExp)[] = [],
) {
  await page.getByRole('button', { name: triggerName }).first().click();

  const drawer = page.locator('[data-slot="drawer-content"]').last();
  await expect(drawer).toBeVisible();

  for (const value of expectedVisible) await expect(drawer).toContainText(value);
  for (const value of expectedHidden) await expect(drawer).not.toContainText(value);

  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
}

async function expectChartTooltipPoint(
  page: Page,
  pointIndex: number,
  expected: {
    label: string;
    metric: string;
    value: number;
    hiddenMetrics?: string[];
  },
) {
  const chart = page.locator('#draft-rounds-chart');
  const tooltip = page.locator('.draft-rounds-chart-tooltip');

  await chart.locator('.draft-rounds-chart-point').nth(pointIndex).hover({ force: true });

  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText(
    new RegExp(
      `${escapeRegex(expected.label)}\\s+${escapeRegex(expected.metric)}\\s+${escapeRegex(expected.value.toString())}`,
      'u',
    ),
  );

  for (const metric of expected.hiddenMetrics ?? [])
    await expect(tooltip.getByText(metric, { exact: true })).toHaveCount(0);
}

function escapeRegex(value: string) {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

test.describe('Draft Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  test.describe('Initial State', () => {
    test('history page shows no drafts', async ({ page, database: _database }) => {
      await page.goto('/history/');
      await expect(page.locator('#history-empty-state')).toBeVisible();
      await expect(page.locator('#history-draft-list')).toHaveCount(0);
    });

    test('admin sees faculty in users page', async ({
      adminPage,
      ndslHeadUserId: _ndsl,
      cslHeadUserId: _csl,
      sclHeadUserId: _scl,
      cvmilHeadUserId: _cvmil,
      aclHeadUserId: _acl,
    }) => {
      await adminPage.goto('/dashboard/users/');
      await expect(adminPage.getByText('ndsl@up.edu.ph')).toBeVisible();
      await expect(adminPage.getByText('csl@up.edu.ph')).toBeVisible();
      await expect(adminPage.getByText('scl@up.edu.ph')).toBeVisible();
      await expect(adminPage.getByText('cvmil@up.edu.ph')).toBeVisible();
      await expect(adminPage.getByText('acl@up.edu.ph')).toBeVisible();
    });

    test('admin drafts page shows no drafts', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/');
      await expect(adminPage.getByText(/no drafts|create.*first/iu)).toBeVisible();
    });

    test('admin labs page shows all labs', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/labs/');
      await expect(
        adminPage.getByText('Networks and Distributed Systems Laboratory'),
      ).toBeVisible();
      await expect(adminPage.getByText('Computer Security Laboratory')).toBeVisible();
      await expect(adminPage.getByText('Scientific Computing Laboratory')).toBeVisible();
      await expect(
        adminPage.getByText('Computer Vision and Machine Intelligence Laboratory'),
      ).toBeVisible();
      await expect(adminPage.getByText('Algorithms and Complexity Laboratory')).toBeVisible();
      await expect(adminPage.locator('input[name="draftId"]')).toHaveCount(0);
    });
  });

  test.describe('Draft Administrators Card', () => {
    test('users page renders the Draft Administrators card with a timeline', async ({
      adminPage,
    }) => {
      await adminPage.goto('/dashboard/users/');
      const card = adminPage.locator('#draft-admins');
      await expect(card).toBeVisible();
      await expect(card.getByText('Draft Administrators', { exact: true })).toBeVisible();
      await expect(card.getByText('Volunteer Candidate Senders')).toBeVisible();
      await expect(card.getByText('Designate a Sender')).toBeVisible();
    });

    test('admin sees the Volunteer button only on their own row', async ({
      adminPage,
      secondAdminUserId: _second,
    }) => {
      await adminPage.goto('/dashboard/users/#draft-admins');
      const card = adminPage.locator('#draft-admins');
      const volunteerButtons = card.getByRole('button', { name: 'Volunteer as Candidate Sender' });
      await expect(volunteerButtons).toHaveCount(1);
    });

    test('hash anchor scrolls the Draft Administrators card into view', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/users/#draft-admins');
      await expect(adminPage.locator('#draft-admins')).toBeInViewport();
    });

    test('draft layout warns destructively when no candidate senders exist', async ({
      adminPage,
    }) => {
      await adminPage.goto('/dashboard/drafts/');
      const callout = adminPage.locator('[role="alert"][data-variant="destructive"]');
      await expect(callout).toBeVisible();
      await expect(callout).toContainText(/volunteer a candidate sender/iu);
    });
  });

  test.describe('Candidate Sender Actions', () => {
    test('seeded candidate flips the draft callout to a warning', async ({
      adminPage,
      seededCandidateSender: _seeded,
    }) => {
      await adminPage.goto('/dashboard/drafts/');
      const callout = adminPage.locator('[role="alert"][data-variant="warning"]');
      await expect(callout).toBeVisible();
      await expect(callout).toContainText(/promote a designated sender/iu);
    });

    test('promote flips row badge to Designated Sender', async ({
      adminEmail,
      adminPage,
      seededCandidateSender: _seeded,
    }) => {
      await adminPage.goto('/dashboard/users/#draft-admins');
      const card = adminPage.locator('#draft-admins');
      const row = getDraftAdminRow(card, adminEmail);
      await expect(row.getByText('Candidate Sender', { exact: true })).toBeVisible();

      await row.getByRole('button', { name: 'Promote', exact: true }).click();
      await expect(row.getByText('Designated Sender', { exact: true })).toBeVisible();
    });

    test('promoted sender shows info callout on draft layout', async ({
      adminEmail,
      adminPage,
      seededCandidateSender: _seeded,
    }) => {
      await adminPage.goto('/dashboard/users/#draft-admins');
      const card = adminPage.locator('#draft-admins');
      const row = getDraftAdminRow(card, adminEmail);
      await row.getByRole('button', { name: 'Promote', exact: true }).click();
      await expect(row.getByText('Designated Sender', { exact: true })).toBeVisible();

      await adminPage.goto('/dashboard/drafts/');
      const callout = adminPage.locator('[role="alert"][data-variant="info"]');
      await expect(callout).toBeVisible();
      await expect(callout).toContainText(/currently designated email sender/iu);
    });

    test('demote reverts a Designated sender back to Candidate', async ({
      adminEmail,
      adminPage,
      seededCandidateSender: _seeded,
    }) => {
      await adminPage.goto('/dashboard/users/#draft-admins');
      const card = adminPage.locator('#draft-admins');
      const row = getDraftAdminRow(card, adminEmail);
      await row.getByRole('button', { name: 'Promote', exact: true }).click();
      await expect(row.getByText('Designated Sender', { exact: true })).toBeVisible();

      await row.getByRole('button', { name: 'Demote', exact: true }).click();
      await expect(row.getByText('Candidate Sender', { exact: true })).toBeVisible();
    });

    test('remove drops a Candidate back to the volunteer state', async ({
      adminEmail,
      adminPage,
      seededCandidateSender: _seeded,
    }) => {
      await adminPage.goto('/dashboard/users/#draft-admins');
      const card = adminPage.locator('#draft-admins');
      const row = getDraftAdminRow(card, adminEmail);
      await expect(row.getByText('Candidate Sender', { exact: true })).toBeVisible();

      await row.getByRole('button', { name: 'Remove', exact: true }).click();
      await expect(row.getByText('Candidate Sender', { exact: true })).toHaveCount(0);
      await expect(
        card.getByRole('button', { name: 'Volunteer as Candidate Sender' }),
      ).toBeVisible();
    });

    test('second admin can promote the first admin candidate', async ({
      adminEmail,
      secondAdminPage,
      seededCandidateSender: _seeded,
    }) => {
      await secondAdminPage.goto('/dashboard/users/#draft-admins');
      const card = secondAdminPage.locator('#draft-admins');
      const row = getDraftAdminRow(card, adminEmail);
      await row.getByRole('button', { name: 'Promote', exact: true }).click();
      await expect(row.getByText('Designated Sender', { exact: true })).toBeVisible();
    });
  });

  test.describe('Student Profile Registration', () => {
    test('Eager lands on /dashboard/student/', async ({ eagerDrafteePage }) => {
      await expect(eagerDrafteePage).toHaveURL('/dashboard/student/');
    });

    test('Eager completes profile with student number', async ({ eagerDrafteePage }) => {
      await expect(eagerDrafteePage.getByText('Complete Your Profile')).toBeVisible();
      await eagerDrafteePage.getByLabel('Student Number').fill('202012345');
      const responsePromise = eagerDrafteePage.waitForResponse('/dashboard/?/profile');
      await eagerDrafteePage.getByRole('button', { name: 'Complete Profile' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('Patient cannot reuse an existing student number', async ({ patientCandidatePage }) => {
      await expect(patientCandidatePage.getByText('Complete Your Profile')).toBeVisible();
      await patientCandidatePage.getByLabel('Student Number').fill('202012345');

      const responsePromise = patientCandidatePage.waitForResponse('/dashboard/?/profile');
      await patientCandidatePage.getByRole('button', { name: 'Complete Profile' }).click();
      const response = await responsePromise;
      const responseData = await response.json();

      expect(response.status()).toBe(200);
      expect(responseData.type).toBe('failure');
      expect(responseData.status).toBe(409);

      await expect(patientCandidatePage.getByText('Complete Your Profile')).toBeVisible();
      await expect(
        patientCandidatePage.getByText('Student number is already in use.'),
      ).toBeVisible();
    });

    test('Patient completes profile', async ({ patientCandidatePage }) => {
      await patientCandidatePage.getByLabel('Student Number').fill('202012346');
      const responsePromise = patientCandidatePage.waitForResponse('/dashboard/?/profile');
      await patientCandidatePage.getByRole('button', { name: 'Complete Profile' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('Persistent completes profile', async ({ persistentHopefulPage }) => {
      await persistentHopefulPage.getByLabel('Student Number').fill('202012347');
      const responsePromise = persistentHopefulPage.waitForResponse('/dashboard/?/profile');
      await persistentHopefulPage.getByRole('button', { name: 'Complete Profile' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('Unlucky completes profile', async ({ unluckyFullRankerPage }) => {
      await unluckyFullRankerPage.getByLabel('Student Number').fill('202012348');
      const responsePromise = unluckyFullRankerPage.waitForResponse('/dashboard/?/profile');
      await unluckyFullRankerPage.getByRole('button', { name: 'Complete Profile' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('PartialToDrafted completes profile', async ({ partialToDraftedPage }) => {
      await partialToDraftedPage.getByLabel('Student Number').fill('202012349');
      const responsePromise = partialToDraftedPage.waitForResponse('/dashboard/?/profile');
      await partialToDraftedPage.getByRole('button', { name: 'Complete Profile' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('PartialToLottery completes profile', async ({ partialToLotteryPage }) => {
      await partialToLotteryPage.getByLabel('Student Number').fill('202012350');
      const responsePromise = partialToLotteryPage.waitForResponse('/dashboard/?/profile');
      await partialToLotteryPage.getByRole('button', { name: 'Complete Profile' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('NoRank completes profile', async ({ noRankStudentPage }) => {
      await noRankStudentPage.getByLabel('Student Number').fill('202012351');
      const responsePromise = noRankStudentPage.waitForResponse('/dashboard/?/profile');
      await noRankStudentPage.getByRole('button', { name: 'Complete Profile' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('Idle completes profile', async ({ idleBystanderPage }) => {
      await idleBystanderPage.getByLabel('Student Number').fill('202012353');
      const responsePromise = idleBystanderPage.waitForResponse('/dashboard/?/profile');
      await idleBystanderPage.getByRole('button', { name: 'Complete Profile' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('Late completes profile', async ({ lateRegistrantPage }) => {
      await lateRegistrantPage.getByLabel('Student Number').fill('202012352');
      const responsePromise = lateRegistrantPage.waitForResponse('/dashboard/?/profile');
      await lateRegistrantPage.getByRole('button', { name: 'Complete Profile' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });
  });

  test.describe('Admin Lab Setup', () => {
    test('navigates to labs page', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/labs/');
      await expect(adminPage).toHaveURL('/dashboard/labs/');
      await expect(
        adminPage.getByText('Networks and Distributed Systems Laboratory'),
      ).toBeVisible();
      await expect(adminPage.getByText('Computer Security Laboratory')).toBeVisible();
      await expect(adminPage.getByText('Scientific Computing Laboratory')).toBeVisible();
      await expect(
        adminPage.getByText('Computer Vision and Machine Intelligence Laboratory'),
      ).toBeVisible();
      await expect(adminPage.getByText('Algorithms and Complexity Laboratory')).toBeVisible();
    });

    test.describe('ACL archive and restore from lab catalog', () => {
      test('archives ACL', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/labs/');

        const aclRow = adminPage
          .locator('tbody tr')
          .filter({ hasText: 'Algorithms and Complexity Laboratory' });
        await expect(aclRow).toBeVisible();

        const archiveResponsePromise = adminPage.waitForResponse('/dashboard/labs/?/archive');
        await aclRow.getByRole('button').click();
        const archiveResponse = await archiveResponsePromise;
        const archiveResponseData = await archiveResponse.json();
        expect(archiveResponseData.type).toBe('success');
      });

      test('shows ACL in archived labs', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/labs/');
        await adminPage.getByRole('tab', { name: /Archived Labs/u }).click();
        const archivedAclRow = adminPage
          .locator('tbody tr')
          .filter({ hasText: 'Algorithms and Complexity Laboratory' });
        await expect(archivedAclRow).toBeVisible();
      });

      test('restores ACL from archived labs', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/labs/');
        await adminPage.getByRole('tab', { name: /Archived Labs/u }).click();
        const archivedAclRow = adminPage
          .locator('tbody tr')
          .filter({ hasText: 'Algorithms and Complexity Laboratory' });
        await expect(archivedAclRow).toBeVisible();

        const restoreResponsePromise = adminPage.waitForResponse('/dashboard/labs/?/restore');
        await archivedAclRow.getByRole('button').click();
        const restoreResponse = await restoreResponsePromise;
        const restoreResponseData = await restoreResponse.json();
        expect(restoreResponseData.type).toBe('success');
      });
    });
  });

  test.describe('Admin Draft Creation', () => {
    test('creates a new draft with 3 rounds', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/');
      await adminPage.getByRole('button', { name: 'Create Draft' }).click();

      const dialog = adminPage.getByRole('dialog');
      await expect(dialog).toBeVisible();

      const formattedDate = addDays(new Date(), 1).toISOString().slice(0, 16);

      await dialog.locator('input#closesAt').fill(formattedDate);
      await dialog.locator('input#rounds').fill('3');

      adminPage.on('dialog', async dialog => await dialog.accept());
      const responsePromise = adminPage.waitForResponse('/dashboard/drafts/?/init');
      await dialog.getByRole('button', { name: 'Create Draft' }).click();

      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
      await expect(dialog).not.toBeVisible();
      await expect(adminPage.getByText(/#\d+/u)).toBeVisible();
      await expect(adminPage.getByText('Registration')).toBeVisible();
    });
  });

  test.describe('Faculty During Registration', () => {
    test('faculty can access lab page', async ({ ndslHeadPage }) => {
      await ndslHeadPage.goto('/dashboard/lab/');
      await expect(
        ndslHeadPage.getByText('Networks and Distributed Systems Laboratory'),
      ).toBeVisible();
    });

    test('faculty sees no students yet', async ({ ndslHeadPage }) => {
      await expectStudentsCallout(
        ndslHeadPage,
        'Students are still registering for this draft. Kindly wait for the draft administrators to officially open the draft.',
        [],
        {
          title: 'Registration Still Open',
          banner: 'Draft registration is currently open and will close on',
        },
      );
    });
  });

  test.describe('Lab Catalog Guards During Registration', () => {
    test('labs page shows destructive callout during registration', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/labs/');
      await expect(adminPage.getByText(/registration is ongoing/iu)).toBeVisible();
      await expect(adminPage.getByText('Changes on this page')).not.toBeVisible();
    });

    test('Archived Labs tab remains accessible during registration', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/labs/');

      const archivedTab = adminPage.getByRole('tab', { name: /Archived Labs/u });
      await expect(archivedTab).toBeEnabled();

      await archivedTab.click();
      await expect(adminPage.getByRole('tabpanel')).toContainText('No archived labs found.');
    });

    test('Create Lab button is disabled', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/labs/');
      await expect(adminPage.getByRole('button', { name: 'Create Lab' })).toBeDisabled();
    });

    test('Archive buttons are disabled', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/labs/');
      const ndslRow = adminPage
        .locator('tbody tr')
        .filter({ hasText: 'Networks and Distributed Systems Laboratory' });
      await expect(ndslRow.getByRole('button')).toBeDisabled();
    });

    test('server rejects lab creation (403)', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/labs/');
      const status = await adminPage.evaluate(async () => {
        const data = new FormData();
        data.set('labId', 'test');
        data.set('name', 'Test Lab');
        const draftInput = document.querySelector('input[name="draftId"]');
        if (draftInput instanceof HTMLInputElement && draftInput.value)
          data.set('draftId', draftInput.value);

        const response = await fetch('/dashboard/labs/?/lab', {
          method: 'POST',
          body: data,
        });
        return response.status;
      });
      expect(status).toBe(403);
    });

    test('server rejects lab creation when draft id is omitted during an active draft (403)', async ({
      adminPage,
    }) => {
      await adminPage.goto('/dashboard/labs/');
      const status = await adminPage.evaluate(async () => {
        const data = new FormData();
        data.set('labId', 'test');
        data.set('name', 'Test Lab');

        const response = await fetch('/dashboard/labs/?/lab', {
          method: 'POST',
          body: data,
        });
        return response.status;
      });
      expect(status).toBe(403);
    });

    test('server rejects lab creation when draft id is invalid (400)', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/labs/');
      const status = await adminPage.evaluate(async () => {
        const data = new FormData();
        data.set('labId', 'test');
        data.set('name', 'Test Lab');
        data.set('draftId', 'not-a-bigint');

        const response = await fetch('/dashboard/labs/?/lab', {
          method: 'POST',
          body: data,
        });
        return response.status;
      });
      expect(status).toBe(400);
    });

    test('server rejects lab archival (403)', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/labs/');
      const status = await adminPage.evaluate(async () => {
        const data = new FormData();
        data.set('archive', 'ndsl');
        const draftInput = document.querySelector('input[name="draftId"]');
        if (draftInput instanceof HTMLInputElement && draftInput.value)
          data.set('draftId', draftInput.value);

        const response = await fetch('/dashboard/labs/?/archive', {
          method: 'POST',
          body: data,
        });
        return response.status;
      });
      expect(status).toBe(403);
    });

    test('server rejects lab restoration (403)', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/labs/');
      const status = await adminPage.evaluate(async () => {
        const data = new FormData();
        data.set('restore', 'ndsl');
        const draftInput = document.querySelector('input[name="draftId"]');
        if (draftInput instanceof HTMLInputElement && draftInput.value)
          data.set('draftId', draftInput.value);

        const response = await fetch('/dashboard/labs/?/restore', {
          method: 'POST',
          body: data,
        });
        return response.status;
      });
      expect(status).toBe(403);
    });
  });

  test.describe('History During Registration', () => {
    test('shows Draft #1 in registration phase', async ({ page }) => {
      await page.goto('/history/');
      await expect(page.getByText('Draft #1')).toBeVisible();
      await expect(page.getByText('currently waiting for students to register')).toBeVisible();
    });

    test.describe('Draft #1 detail page', () => {
      test('shows registration status', async ({ page }) => {
        await page.goto('/history/1/');
        await expect(page.getByText('registration stage')).toBeVisible();
      });

      test('shows creation event in timeline', async ({ page }) => {
        await page.goto('/history/1/');
        const items = page.locator('section > ol.border-s > li.ms-6 ol.space-y-1 > li');
        await expect(items).toHaveCount(1);
        await expect(items.first()).toContainText('Draft #1 was created.');
      });
    });
  });

  test.describe('Student Lab Preferences', () => {
    test('Eager submits full preferences (NDSL > CSL > SCL)', async ({ eagerDrafteePage }) => {
      await eagerDrafteePage.goto('/dashboard/student/');
      await expect(eagerDrafteePage.getByText('Select Lab Preference')).toBeVisible();

      await eagerDrafteePage
        .getByRole('button', { name: 'Networks and Distributed Systems Laboratory' })
        .click();
      await eagerDrafteePage.getByRole('button', { name: 'Computer Security Laboratory' }).click();
      await eagerDrafteePage
        .getByRole('button', { name: 'Scientific Computing Laboratory' })
        .click();

      await eagerDrafteePage.getByLabel('Photo Consent').selectOption('google');
      eagerDrafteePage.on('dialog', dialog => dialog.accept());
      const responsePromise = eagerDrafteePage.waitForResponse('/dashboard/student/?/submit');
      await eagerDrafteePage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('Patient submits full preferences (CSL > NDSL > SCL)', async ({
      patientCandidatePage,
    }) => {
      await patientCandidatePage.goto('/dashboard/student/');
      await expect(patientCandidatePage.getByText('Select Lab Preference')).toBeVisible();

      await patientCandidatePage
        .getByRole('button', { name: 'Computer Security Laboratory' })
        .click();
      await patientCandidatePage
        .getByRole('button', { name: 'Networks and Distributed Systems Laboratory' })
        .click();
      await patientCandidatePage
        .getByRole('button', { name: 'Scientific Computing Laboratory' })
        .click();

      await patientCandidatePage.getByLabel('Photo Consent').selectOption('none');
      patientCandidatePage.on('dialog', dialog => dialog.accept());
      const responsePromise = patientCandidatePage.waitForResponse('/dashboard/student/?/submit');
      await patientCandidatePage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('Persistent submits full preferences (SCL > CVMIL > ACL)', async ({
      persistentHopefulPage,
    }) => {
      await persistentHopefulPage.goto('/dashboard/student/');
      await expect(persistentHopefulPage.getByText('Select Lab Preference')).toBeVisible();

      await persistentHopefulPage
        .getByRole('button', { name: 'Scientific Computing Laboratory' })
        .click();
      await persistentHopefulPage
        .getByRole('button', { name: 'Computer Vision and Machine Intelligence Laboratory' })
        .click();
      await persistentHopefulPage
        .getByRole('button', { name: 'Algorithms and Complexity Laboratory' })
        .click();

      await persistentHopefulPage.getByLabel('Photo Consent').selectOption('none');
      persistentHopefulPage.on('dialog', dialog => dialog.accept());
      const responsePromise = persistentHopefulPage.waitForResponse('/dashboard/student/?/submit');
      await persistentHopefulPage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('Unlucky submits full preferences (ACL > CVMIL > NDSL)', async ({
      unluckyFullRankerPage,
    }) => {
      await unluckyFullRankerPage.goto('/dashboard/student/');
      await expect(unluckyFullRankerPage.getByText('Select Lab Preference')).toBeVisible();

      await unluckyFullRankerPage
        .getByRole('button', { name: 'Algorithms and Complexity Laboratory' })
        .click();
      await unluckyFullRankerPage
        .getByRole('button', { name: 'Computer Vision and Machine Intelligence Laboratory' })
        .click();
      await unluckyFullRankerPage
        .getByRole('button', { name: 'Networks and Distributed Systems Laboratory' })
        .click();

      await unluckyFullRankerPage.getByLabel('Photo Consent').selectOption('google');
      unluckyFullRankerPage.on('dialog', dialog => dialog.accept());
      const responsePromise = unluckyFullRankerPage.waitForResponse('/dashboard/student/?/submit');
      await unluckyFullRankerPage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('PartialToDrafted submits 2 preferences (NDSL > CSL)', async ({
      partialToDraftedPage,
    }) => {
      await partialToDraftedPage.goto('/dashboard/student/');
      await expect(partialToDraftedPage.getByText('Select Lab Preference')).toBeVisible();

      await partialToDraftedPage
        .getByRole('button', { name: 'Networks and Distributed Systems Laboratory' })
        .click();
      await partialToDraftedPage
        .getByRole('button', { name: 'Computer Security Laboratory' })
        .click();

      await partialToDraftedPage.getByLabel('Photo Consent').selectOption('google');
      partialToDraftedPage.on('dialog', dialog => dialog.accept());
      const responsePromise = partialToDraftedPage.waitForResponse('/dashboard/student/?/submit');
      await partialToDraftedPage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('PartialToLottery submits 1 preference (ACL)', async ({ partialToLotteryPage }) => {
      await partialToLotteryPage.goto('/dashboard/student/');
      await expect(partialToLotteryPage.getByText('Select Lab Preference')).toBeVisible();

      await partialToLotteryPage
        .getByRole('button', { name: 'Algorithms and Complexity Laboratory' })
        .click();

      await partialToLotteryPage.getByLabel('Photo Consent').selectOption('none');
      partialToLotteryPage.on('dialog', dialog => dialog.accept());
      const responsePromise = partialToLotteryPage.waitForResponse('/dashboard/student/?/submit');
      await partialToLotteryPage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('NoRank submits 0 prefs (goes directly to lottery)', async ({ noRankStudentPage }) => {
      await noRankStudentPage.goto('/dashboard/student/');
      await expect(noRankStudentPage.getByText('Select Lab Preference')).toBeVisible();

      await noRankStudentPage.getByLabel('Photo Consent').selectOption('none');
      noRankStudentPage.on('dialog', dialog => dialog.accept());
      const responsePromise = noRankStudentPage.waitForResponse('/dashboard/student/?/submit');
      await noRankStudentPage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('NoRank sees submitted state after reload', async ({ noRankStudentPage }) => {
      await noRankStudentPage.goto('/dashboard/student/');
      await expect(noRankStudentPage.getByText('Registration Complete')).toBeVisible();
      await expect(noRankStudentPage.getByText('No Labs Selected')).toBeVisible();
    });

    test('Eager sees photo-share receipt copy after reload', async ({ eagerDrafteePage }) => {
      await eagerDrafteePage.goto('/dashboard/student/');
      await expect(
        eagerDrafteePage.getByText('Faculty will see this photo during review.'),
      ).toBeVisible();
    });

    test('Patient sees opt-out receipt copy after reload', async ({ patientCandidatePage }) => {
      await patientCandidatePage.goto('/dashboard/student/');
      await expect(
        patientCandidatePage.getByText(
          'You chose not to share a photo; faculty will see only your name and student number.',
        ),
      ).toBeVisible();
    });

    test('Idle submits 0 prefs (goes directly to lottery)', async ({ idleBystanderPage }) => {
      await idleBystanderPage.goto('/dashboard/student/');
      await expect(idleBystanderPage.getByText('Select Lab Preference')).toBeVisible();

      await idleBystanderPage.getByLabel('Photo Consent').selectOption('none');
      idleBystanderPage.on('dialog', dialog => dialog.accept());
      const responsePromise = idleBystanderPage.waitForResponse('/dashboard/student/?/submit');
      await idleBystanderPage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });
  });

  test.describe('Admin Starts Draft', () => {
    test('navigates to draft detail page', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/');
      await adminPage.getByRole('link', { name: 'View' }).first().click();
      await expect(adminPage).toHaveURL(/\/dashboard\/drafts\/1\//u);
    });

    test('sees registrant list', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await expect(adminPage.getByText('There are currently')).toBeVisible();
      await expect(adminPage.getByText(/\b8\b/u).first()).toBeVisible();
      await expectVisibleButtons(adminPage, ['See Registered Students']);
    });

    test('registered draftees do not fetch before the sheet opens', async ({ adminPage }) => {
      const noResponseBeforeOpen = expect(
        adminPage.waitForResponse(
          response => new URL(response.url()).pathname === '/dashboard/drafts/1/draftees',
          { timeout: 1000 },
        ),
      ).rejects.toThrow();

      await adminPage.goto('/dashboard/drafts/1/');
      await expectVisibleButtons(adminPage, ['See Registered Students']);
      await adminPage.waitForLoadState('networkidle');
      await noResponseBeforeOpen;
    });

    test('registered draftees fetch when the sheet opens', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await expectVisibleButtons(adminPage, ['See Registered Students']);
      const responsePromise = adminPage.waitForResponse(
        response => new URL(response.url()).pathname === '/dashboard/drafts/1/draftees',
      );
      await adminPage.getByRole('button', { name: 'See Registered Students' }).click();
      await responsePromise;
    });

    test('shows initial snapshot quotas as placeholders', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      const editor = adminPage.locator('#draft-quota-editor-initial');
      await expect(editor).toBeVisible();

      const aclInput = editor.locator('input[name="acl"]');
      await expect(aclInput).toHaveValue('');
      await expect(aclInput).toHaveAttribute('placeholder', '0');

      const ndslInput = editor.locator('input[name="ndsl"]');
      await expect(ndslInput).toHaveValue('');
      await expect(ndslInput).toHaveAttribute('placeholder', '0');
    });

    test.describe('initial snapshot updates', () => {
      test('updates initial snapshots', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/drafts/1/');
        const editor = adminPage.locator('#draft-quota-editor-initial');
        await expect(editor).toBeVisible();

        await editor.locator('input[name="ndsl"]').fill('2');
        await editor.locator('input[name="csl"]').fill('2');
        await editor.locator('input[name="scl"]').fill('2');
        await editor.locator('input[name="cvmil"]').fill('1');
        await editor.locator('input[name="acl"]').fill('1');

        const responsePromise = adminPage.waitForResponse('/dashboard/drafts/1/?/quota');
        await editor.getByRole('button', { name: 'Update Initial Snapshots' }).click();
        const response = await responsePromise;
        const responseData = await response.json();
        expect(responseData.type).toBe('success');
      });

      test('shows committed placeholders after update', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/drafts/1/');
        const editor = adminPage.locator('#draft-quota-editor-initial');
        await expect(editor).toBeVisible();

        const aclInput = editor.locator('input[name="acl"]');
        await expect(aclInput).toHaveValue('');
        await expect(aclInput).toHaveAttribute('placeholder', '1');

        const ndslInput = editor.locator('input[name="ndsl"]');
        await expect(ndslInput).toHaveValue('');
        await expect(ndslInput).toHaveAttribute('placeholder', '2');
      });
    });

    test('starts the draft', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      adminPage.on('dialog', dialog => dialog.accept());
      const responsePromise = adminPage.waitForResponse('/dashboard/drafts/1/?/start');
      await adminPage.getByRole('button', { name: 'Start Draft' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
      await expect(adminPage.getByText(/Round 1/u).first()).toBeVisible();
    });
  });

  test.describe('Late Registrant', () => {
    test('sees registration closed message', async ({ lateRegistrantPage }) => {
      await lateRegistrantPage.goto('/dashboard/student/');
      await expect(lateRegistrantPage.getByText('Registration Closed')).toBeVisible();
    });
  });

  test.describe('Lab Catalog Guards Lifted After Registration', () => {
    test('Create Lab button is enabled after registration ends', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/labs/');
      await expect(adminPage.getByRole('button', { name: 'Create Lab' })).toBeEnabled();
      await expect(adminPage.getByText('Changes on this page')).toBeVisible();
    });

    test('Archive buttons are enabled after registration ends', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/labs/');
      const ndslRow = adminPage
        .locator('tbody tr')
        .filter({ hasText: 'Networks and Distributed Systems Laboratory' });
      await expect(ndslRow.getByRole('button')).toBeEnabled();
    });
  });

  test.describe('Students During Draft In Progress', () => {
    test('NoRank sees draft progress with empty submission', async ({ noRankStudentPage }) => {
      await noRankStudentPage.goto('/dashboard/student/');
      await expect(noRankStudentPage.getByText('The draft is in progress.')).toBeVisible();
      await expect(noRankStudentPage.getByText('No Labs Selected')).toBeVisible();
    });

    test('Eager sees draft progress with lab preferences', async ({ eagerDrafteePage }) => {
      await eagerDrafteePage.goto('/dashboard/student/');
      await expect(eagerDrafteePage.getByText('The draft is in progress.')).toBeVisible();
      await expect(eagerDrafteePage.getByText('Your Lab Preferences')).toBeVisible();
    });
  });

  test.describe('Round 1 — 1st choice', () => {
    test('admin draft page shows regular loader labels', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await expect(adminPage.locator('#regular-round-summary-chart')).toBeVisible();

      await adminPage.getByRole('tab', { name: 'Registered Students' }).click();
      await expect(adminPage.getByRole('tabpanel', { name: 'Registered Students' })).toBeVisible();
      await expectRegularStudentsViewOptions(adminPage, 'Pending Selection');
      await selectRegularStudentsView(adminPage, 'Already Drafted');
      await expectRegularStudentsViewOptions(adminPage, 'Already Drafted');

      await adminPage.getByRole('tab', { name: 'Lab Distributions' }).click();
      await expect(adminPage.locator('#regular-round-summary-chart')).toBeVisible();
    });

    test('pending selection does not fetch until Registered Students tab is opened', async ({
      adminPage,
    }) => {
      const noResponseBeforeOpen = expect(
        adminPage.waitForResponse(
          response => new URL(response.url()).pathname === '/dashboard/drafts/1/draftees',
          { timeout: 1000 },
        ),
      ).rejects.toThrow();

      await adminPage.goto('/dashboard/drafts/1/');
      await expect(adminPage.locator('#regular-round-summary-chart')).toBeVisible();
      await adminPage.waitForLoadState('networkidle');
      await noResponseBeforeOpen;

      const initialResponse = adminPage.waitForResponse(
        response => new URL(response.url()).pathname === '/dashboard/drafts/1/draftees',
      );
      await adminPage.getByRole('tab', { name: 'Registered Students' }).click();
      await expect(adminPage.getByRole('tabpanel', { name: 'Registered Students' })).toBeVisible();
      await initialResponse;
      await expectRegularStudentsViewOptions(adminPage, 'Pending Selection');
    });

    test('View System Logs opens the regular-round drawer', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');

      await expectDrawerContents(adminPage, 'View System Logs', [
        /System Logs/u,
        /Show System Automation Logs/u,
      ]);
    });

    test('View Undrafted opens the regular-round drawer', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');

      await expectDrawerContents(adminPage, 'View Undrafted', [
        /Undrafted Students/u,
        /Select at least one lab to view students\./u,
      ]);
    });

    test('switching to already drafted does not refetch after initial load', async ({
      adminPage,
    }) => {
      const initialResponse = adminPage.waitForResponse(
        response => new URL(response.url()).pathname === '/dashboard/drafts/1/draftees',
      );

      await adminPage.goto('/dashboard/drafts/1/');
      await adminPage.getByRole('tab', { name: 'Registered Students' }).click();
      await expect(adminPage.getByRole('tabpanel', { name: 'Registered Students' })).toBeVisible();
      await initialResponse;

      const noResponseOnSwitch = expect(
        adminPage.waitForResponse(
          response => new URL(response.url()).pathname === '/dashboard/drafts/1/draftees',
          { timeout: 1000 },
        ),
      ).rejects.toThrow();
      await selectRegularStudentsView(adminPage, 'Already Drafted');
      await noResponseOnSwitch;
    });

    test('switching back to pending selection does not refetch after initial load', async ({
      adminPage,
    }) => {
      const initialResponse = adminPage.waitForResponse(
        response => new URL(response.url()).pathname === '/dashboard/drafts/1/draftees',
      );

      await adminPage.goto('/dashboard/drafts/1/');
      await adminPage.getByRole('tab', { name: 'Registered Students' }).click();
      await expect(adminPage.getByRole('tabpanel', { name: 'Registered Students' })).toBeVisible();
      await initialResponse;
      await selectRegularStudentsView(adminPage, 'Already Drafted');

      const noResponseOnSwitch = expect(
        adminPage.waitForResponse(
          response => new URL(response.url()).pathname === '/dashboard/drafts/1/draftees',
          { timeout: 1000 },
        ),
      ).rejects.toThrow();
      await selectRegularStudentsView(adminPage, 'Pending Selection');
      await noResponseOnSwitch;
    });

    test.describe('NDSL', () => {
      test('before submission: full quota, no Previous Picks, progress bar at zero', async ({
        ndslHeadPage,
      }) => {
        await ndslHeadPage.goto('/dashboard/students/');
        await expectStatCards(ndslHeadPage, { quota: 2, remaining: 2, drafted: 0 });
        await expectNoPreviousPicks(ndslHeadPage);
        await expect(ndslHeadPage.locator('#selection-progress')).toContainText('0 / 2 slots');
        await expect(ndslHeadPage.getByRole('button', { name: 'Submit Selection' })).toBeVisible();
      });

      test('sees 1st-choice students (Eager, PartialToDrafted)', async ({ ndslHeadPage }) => {
        await ndslHeadPage.goto('/dashboard/students/');
        await expect(ndslHeadPage.getByRole('button', { name: /Eager/u })).toBeVisible();
        await expect(ndslHeadPage.getByRole('button', { name: /Partial/u })).toBeVisible();
      });

      test('selects Eager', async ({ ndslHeadPage }) => {
        await ndslHeadPage.goto('/dashboard/students/');
        await ndslHeadPage.getByRole('button', { name: /Eager/u }).click();
        await expect(ndslHeadPage.locator('li[data-selected="true"]')).toHaveCount(1);
        await expect(ndslHeadPage.locator('li[data-selected="true"]')).toContainText(/Eager/u);
        await expect(ndslHeadPage.locator('#selection-progress')).toHaveText(/1 \/ 2 slots/u);
        ndslHeadPage.on('dialog', dialog => dialog.accept());
        const responsePromise = ndslHeadPage.waitForResponse('/dashboard/students/?/rankings');
        await ndslHeadPage.getByRole('button', { name: 'Submit Selection' }).click();
        const response = await responsePromise;
        const responseData = await response.json();
        expect(responseData.type).toBe('success');

        await expect(ndslHeadPage.getByRole('button', { name: 'Update Selection' })).toBeVisible();
      });

      test('after submission: reflects 1 drafted', async ({ ndslHeadPage }) => {
        await ndslHeadPage.goto('/dashboard/students/');
        await expectStatCards(ndslHeadPage, { quota: 2, remaining: 1, drafted: 1 });
      });

      test('can amend picks while round is still active', async ({ ndslHeadPage }) => {
        await ndslHeadPage.goto('/dashboard/students/');
        await expect(ndslHeadPage.getByRole('button', { name: 'Update Selection' })).toBeVisible();
        await expect(ndslHeadPage.getByRole('button', { name: /Eager/u })).toBeVisible();
        await expect(ndslHeadPage.getByRole('button', { name: /Partial/u })).toBeVisible();

        // Replace the prior selection (Eager) with Partial before the round advances.
        await ndslHeadPage.getByRole('button', { name: /Eager/u }).click();
        await ndslHeadPage.getByRole('button', { name: /Partial/u }).click();
        ndslHeadPage.on('dialog', dialog => dialog.accept());
        const responsePromise = ndslHeadPage.waitForResponse('/dashboard/students/?/rankings');
        await ndslHeadPage.getByRole('button', { name: 'Update Selection' }).click();
        const response = await responsePromise;
        const responseData = await response.json();
        expect(responseData.type).toBe('success');

        await expect(ndslHeadPage.getByRole('button', { name: 'Update Selection' })).toBeVisible();
      });

      test('unsaved inline changes do not persist after reload', async ({ ndslHeadPage }) => {
        await ndslHeadPage.goto('/dashboard/students/');

        // Make a change without submitting
        await ndslHeadPage.getByRole('button', { name: /Eager/u }).click();
        await ndslHeadPage.goto('/dashboard/students/');

        await expect(ndslHeadPage.getByRole('button', { name: 'Update Selection' })).toBeVisible();

        // Original saved selection should still be visible after reload
        await expectPreviousPicksTab(ndslHeadPage, 1, [/Partial/u]);
        await expect(ndslHeadPage.locator('#selection-progress')).toContainText('1 /');
      });

      test('can edit to empty selection', async ({ ndslHeadPage }) => {
        await ndslHeadPage.goto('/dashboard/students/');

        // Deselect the current pick (Partial from previous test)
        await ndslHeadPage.getByRole('button', { name: /Partial/u }).click();
        await expect(ndslHeadPage.locator('#selection-progress')).toContainText('0 /');

        ndslHeadPage.on('dialog', dialog => dialog.accept());
        const responsePromise = ndslHeadPage.waitForResponse('/dashboard/students/?/rankings');
        await ndslHeadPage.getByRole('button', { name: 'Update Selection' }).click();
        const response = await responsePromise;
        const responseData = await response.json();
        expect(responseData.type).toBe('success');

        await expect(ndslHeadPage.getByRole('button', { name: 'Update Selection' })).toBeVisible();

        // Stat cards should show 0 drafted for this round
        await expectStatCards(ndslHeadPage, { quota: 2, remaining: 2, drafted: 0 });
      });

      test('can reselect after empty edit', async ({ ndslHeadPage }) => {
        await ndslHeadPage.goto('/dashboard/students/');

        // Re-select Eager to restore expected state for subsequent tests
        await ndslHeadPage.getByRole('button', { name: /Eager/u }).click();
        ndslHeadPage.on('dialog', dialog => dialog.accept());
        const responsePromise = ndslHeadPage.waitForResponse('/dashboard/students/?/rankings');
        await ndslHeadPage.getByRole('button', { name: 'Update Selection' }).click();
        const response = await responsePromise;
        const responseData = await response.json();
        expect(responseData.type).toBe('success');

        await expectStatCards(ndslHeadPage, { quota: 2, remaining: 1, drafted: 1 });
      });

      test('can edit multiple times in same round', async ({ ndslHeadPage }) => {
        await ndslHeadPage.goto('/dashboard/students/');

        // First edit: swap Eager for Partial
        await ndslHeadPage.getByRole('button', { name: /Eager/u }).click();
        await ndslHeadPage.getByRole('button', { name: /Partial/u }).click();
        ndslHeadPage.on('dialog', dialog => dialog.accept());
        let responsePromise = ndslHeadPage.waitForResponse('/dashboard/students/?/rankings');
        await ndslHeadPage.getByRole('button', { name: 'Update Selection' }).click();
        let response = await responsePromise;
        expect((await response.json()).type).toBe('success');
        await expectPreviousPicksTab(ndslHeadPage, 1, [/Partial/u]);

        // Second edit: swap back to Eager
        await ndslHeadPage.getByRole('button', { name: /Partial/u }).click();
        await ndslHeadPage.getByRole('button', { name: /Eager/u }).click();
        responsePromise = ndslHeadPage.waitForResponse('/dashboard/students/?/rankings');
        await ndslHeadPage.getByRole('button', { name: 'Update Selection' }).click();
        response = await responsePromise;
        expect((await response.json()).type).toBe('success');
        await expectPreviousPicksTab(ndslHeadPage, 1, [/Eager/u]);
      });

      test('can edit with no changes (idempotent)', async ({ ndslHeadPage }) => {
        await ndslHeadPage.goto('/dashboard/students/');

        await expect(ndslHeadPage.getByRole('button', { name: 'Update Selection' })).toBeVisible();

        // Eager should already be selected (from previous test)
        await expect(ndslHeadPage.locator('#selection-progress')).toContainText('1 /');

        // Submit without changes
        ndslHeadPage.on('dialog', dialog => dialog.accept());
        const responsePromise = ndslHeadPage.waitForResponse('/dashboard/students/?/rankings');
        await ndslHeadPage.getByRole('button', { name: 'Update Selection' }).click();
        const response = await responsePromise;
        expect((await response.json()).type).toBe('success');

        // Selection should remain unchanged
        await expectPreviousPicksTab(ndslHeadPage, 1, [/Eager/u]);
        await expectStatCards(ndslHeadPage, { quota: 2, remaining: 1, drafted: 1 });
      });
    });

    test.describe('CSL', () => {
      test('before submission: full quota, no Previous Picks', async ({ cslHeadPage }) => {
        await cslHeadPage.goto('/dashboard/students/');
        await expectStatCards(cslHeadPage, { quota: 2, remaining: 2, drafted: 0 });
        await expectNoPreviousPicks(cslHeadPage);
      });

      test('selects Patient', async ({ cslHeadPage }) => {
        await cslHeadPage.goto('/dashboard/students/');
        await cslHeadPage.getByRole('button', { name: /Patient/u }).click();
        cslHeadPage.on('dialog', dialog => dialog.accept());
        const responsePromise = cslHeadPage.waitForResponse('/dashboard/students/?/rankings');
        await cslHeadPage.getByRole('button', { name: 'Submit Selection' }).click();
        const response = await responsePromise;
        const responseData = await response.json();
        expect(responseData.type).toBe('success');

        await expect(cslHeadPage.getByRole('button', { name: 'Update Selection' })).toBeVisible();
      });

      test('after submission: reflects 1 drafted', async ({ cslHeadPage }) => {
        await cslHeadPage.goto('/dashboard/students/');
        await expectStatCards(cslHeadPage, { quota: 2, remaining: 1, drafted: 1 });
      });

      test('can re-submit (edit) after selecting sole preferrer without 409', async ({
        cslHeadPage,
      }) => {
        // Patient is CSL's only Round 1 preferrer and is already in facultyChoiceUser.
        // Re-submitting with Patient still selected must NOT trigger the
        // no-preferences auto-acknowledge guard (HTTP 409).
        await cslHeadPage.goto('/dashboard/students/');
        cslHeadPage.on('dialog', dialog => dialog.accept());
        const responsePromise = cslHeadPage.waitForResponse('/dashboard/students/?/rankings');
        await cslHeadPage.getByRole('button', { name: 'Update Selection' }).click();
        const response = await responsePromise;
        expect(response.status()).not.toBe(409);
      });
    });

    test.describe('SCL', () => {
      test('before submission: full quota, no Previous Picks', async ({ sclHeadPage }) => {
        await sclHeadPage.goto('/dashboard/students/');
        await expectStatCards(sclHeadPage, { quota: 2, remaining: 2, drafted: 0 });
        await expectNoPreviousPicks(sclHeadPage);
      });

      test('skips (sees Persistent)', async ({ sclHeadPage }) => {
        await sclHeadPage.goto('/dashboard/students/');
        await expect(sclHeadPage.getByRole('button', { name: /Persistent/u })).toBeVisible();
        sclHeadPage.on('dialog', dialog => dialog.accept());
        const responsePromise = sclHeadPage.waitForResponse('/dashboard/students/?/rankings');
        await sclHeadPage.getByRole('button', { name: 'Submit Selection' }).click();
        const response = await responsePromise;
        const responseData = await response.json();
        expect(responseData.type).toBe('success');

        await expect(sclHeadPage.getByRole('button', { name: 'Update Selection' })).toBeVisible();
      });

      test('after submission: unchanged', async ({ sclHeadPage }) => {
        await sclHeadPage.goto('/dashboard/students/');
        await expectStatCards(sclHeadPage, { quota: 2, remaining: 2, drafted: 0 });
      });
    });

    test.describe('CVMIL', () => {
      test('auto-acknowledged: full quota, no preferences', async ({ cvmilHeadPage }) => {
        await cvmilHeadPage.goto('/dashboard/students/');
        await expectStatCards(cvmilHeadPage, { quota: 1, remaining: 1, drafted: 0 });
      });

      test('sees no-preferences auto-acknowledgement', async ({ cvmilHeadPage }) => {
        await expectStudentsCallout(
          cvmilHeadPage,
          'No undrafted students have selected this lab in this round.',
          ['This lab has no more draft slots remaining for the rest of this draft.'],
          { title: 'No Student Preferences This Round' },
        );
      });

      test('server rejects forced updates after round-start no-preferences auto-acknowledgement', async ({
        cvmilHeadPage,
      }) => {
        await cvmilHeadPage.goto('/dashboard/students/');
        const status = await postFacultyRankings(cvmilHeadPage, 1, 1);

        expect(status).toBe(409);
      });
    });

    test.describe('ACL', () => {
      test('before submission: full quota, no Previous Picks', async ({ aclHeadPage }) => {
        await aclHeadPage.goto('/dashboard/students/');
        await expectStatCards(aclHeadPage, { quota: 1, remaining: 1, drafted: 0 });
        await expectNoPreviousPicks(aclHeadPage);
      });

      test('edit conflict: CSL gets 409 when ACL submits and advances round', async ({
        cslHeadPage,
        aclHeadPage,
      }) => {
        // CSL prepares an inline update (CSL already submitted earlier)
        await cslHeadPage.goto('/dashboard/students/');
        await expect(cslHeadPage.getByRole('button', { name: 'Update Selection' })).toBeVisible();

        // ACL submits (last lab), which advances the round
        await aclHeadPage.goto('/dashboard/students/');
        await expect(aclHeadPage.getByRole('button', { name: /Unlucky/u })).toBeVisible();
        aclHeadPage.on('dialog', dialog => dialog.accept());
        const aclResponsePromise = aclHeadPage.waitForResponse('/dashboard/students/?/rankings');
        await aclHeadPage.getByRole('button', { name: 'Submit Selection' }).click();
        const aclResponse = await aclResponsePromise;
        const aclResponseData = await aclResponse.json();
        expect(aclResponseData.type).toBe('success');

        // CSL tries to submit its stale inline update - should get 409 failure and see error toast
        cslHeadPage.on('dialog', dialog => dialog.accept());
        const cslResponsePromise = cslHeadPage.waitForResponse('/dashboard/students/?/rankings');
        await cslHeadPage.getByRole('button', { name: 'Update Selection' }).click();
        const cslResponse = await cslResponsePromise;
        const cslResponseData = await cslResponse.json();

        expect(cslResponse.status()).toBe(200);
        expect(cslResponseData.type).toBe('failure');
        expect(cslResponseData.status).toBe(409);

        // Should show error toast and refresh
        await expect(cslHeadPage.getByText('Round advanced while editing')).toBeVisible();
      });

      test('after submission: unchanged', async ({ aclHeadPage }) => {
        await aclHeadPage.goto('/dashboard/students/');
        await expectStatCards(aclHeadPage, { quota: 1, remaining: 1, drafted: 0 });
      });
    });
  });

  test.describe('Verify Round 2', () => {
    test('draft is now in Round 2', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await expect(adminPage.getByText(/Round 2/u).first()).toBeVisible();
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
  });

  test.describe('Server-side validation security', () => {
    // Tests that bypass UI to verify backend rejects invalid student selections.
    // These tests simulate malicious payloads sent directly to the API.

    test('rejects fabricated student ID', async ({ ndslHeadPage }) => {
      await ndslHeadPage.goto('/dashboard/students/');
      const status = await postFacultyRankings(ndslHeadPage, 1, 2, ['nonexistent-user-id-12345']);

      expect(status).toBe(409);
    });

    test('rejects student who chose different lab for current round', async ({
      ndslHeadPage,
      persistentHopefulUserId,
    }) => {
      // Persistent has SCL(1) > CVMIL(2) > ACL(3) — never chose NDSL.
      // NDSL trying to select Persistent in Round 2 should fail.
      await ndslHeadPage.goto('/dashboard/students/');
      const status = await postFacultyRankings(ndslHeadPage, 1, 2, [persistentHopefulUserId]);

      expect(status).toBe(409);
    });

    test('rejects student whose lab preference is in different round', async ({
      ndslHeadPage,
      unluckyFullRankerUserId,
    }) => {
      // Unlucky has ACL(1) > CVMIL(2) > NDSL(3) — NDSL is 3rd choice, not 2nd.
      // NDSL trying to select Unlucky in Round 2 should fail.
      await ndslHeadPage.goto('/dashboard/students/');
      const status = await postFacultyRankings(ndslHeadPage, 1, 2, [unluckyFullRankerUserId]);

      expect(status).toBe(409);
    });

    test('rejects already-drafted student even if preference matches current round', async ({
      ndslHeadPage,
      patientCandidateUserId,
    }) => {
      // Patient has CSL(1) > NDSL(2) > SCL(3) and was drafted by CSL in Round 1.
      // In Round 2, Patient's 2nd choice is NDSL — but Patient is already drafted.
      // This tests the already-drafted filter, not round-index mismatch.
      await ndslHeadPage.goto('/dashboard/students/');
      const status = await postFacultyRankings(ndslHeadPage, 1, 2, [patientCandidateUserId]);

      expect(status).toBe(409);
    });

    test('rejects student who never submitted rankings', async ({
      ndslHeadPage,
      idleBystanderUserId,
    }) => {
      // Idle never submitted any lab preferences.
      // NDSL trying to select Idle should fail.
      await ndslHeadPage.goto('/dashboard/students/');
      const status = await postFacultyRankings(ndslHeadPage, 1, 2, [idleBystanderUserId]);

      expect(status).toBe(409);
    });

    test('rejects batch with mix of valid and invalid students', async ({
      ndslHeadPage,
      persistentHopefulUserId,
      eagerDrafteeUserId,
    }) => {
      // Send one invalid student (Persistent - never chose NDSL) mixed with a drafted one.
      // Should reject entire batch.
      await ndslHeadPage.goto('/dashboard/students/');
      const status = await postFacultyRankings(ndslHeadPage, 1, 2, [
        persistentHopefulUserId,
        eagerDrafteeUserId,
      ]);

      expect(status).toBe(409);
    });
  });

  test.describe('Round 2 — 2nd choice', () => {
    // NDSL: Patient ranked NDSL 2nd, but Patient is drafted → no undrafted 2nd-choice students → auto-acknowledged
    // SCL, ACL: no undrafted 2nd-choice students → auto-acknowledged

    test.describe('NDSL', () => {
      test('auto-acknowledged: no-preferences message', async ({ ndslHeadPage }) => {
        await expectStudentsCallout(
          ndslHeadPage,
          'No undrafted students have selected this lab in this round.',
          ['This lab has no more draft slots remaining for the rest of this draft.'],
          { title: 'No Student Preferences This Round' },
        );
      });

      test('server rejects forced updates after no-preferences auto-acknowledgement', async ({
        ndslHeadPage,
      }) => {
        await ndslHeadPage.goto('/dashboard/students/');
        const status = await postFacultyRankings(ndslHeadPage, 1, 2);

        expect(status).toBe(409);
      });

      test('stat cards: 1 drafted, Previous Picks Round 1 with Eager', async ({ ndslHeadPage }) => {
        await ndslHeadPage.goto('/dashboard/students/');
        await expectStatCards(ndslHeadPage, { quota: 2, remaining: 1, drafted: 1 });
        await expectPreviousPicksTab(ndslHeadPage, 1, [
          /Draftee, Eager/u,
          /202012345/u,
          /eager\.student@up\.edu\.ph/u,
        ]);
      });
    });

    test.describe('SCL', () => {
      test('auto-acknowledged: no-preferences message', async ({ sclHeadPage }) => {
        await expectStudentsCallout(
          sclHeadPage,
          'No undrafted students have selected this lab in this round.',
          ['This lab has no more draft slots remaining for the rest of this draft.'],
          { title: 'No Student Preferences This Round' },
        );
      });

      test('stat cards unchanged, no researchers', async ({ sclHeadPage }) => {
        await sclHeadPage.goto('/dashboard/students/');
        await expectStatCards(sclHeadPage, { quota: 2, remaining: 2, drafted: 0 });
      });
    });

    test.describe('ACL', () => {
      test('auto-acknowledged: no-preferences message', async ({ aclHeadPage }) => {
        await expectStudentsCallout(
          aclHeadPage,
          'No undrafted students have selected this lab in this round.',
          ['This lab has no more draft slots remaining for the rest of this draft.'],
          { title: 'No Student Preferences This Round' },
        );
      });

      test('stat cards unchanged, no researchers', async ({ aclHeadPage }) => {
        await aclHeadPage.goto('/dashboard/students/');
        await expectStatCards(aclHeadPage, { quota: 1, remaining: 1, drafted: 0 });
      });
    });

    test.describe('CSL', () => {
      test('before submission: Previous Picks Round 1 with Patient', async ({ cslHeadPage }) => {
        await cslHeadPage.goto('/dashboard/students/');
        await expectStatCards(cslHeadPage, { quota: 2, remaining: 1, drafted: 1 });
        await expect(cslHeadPage.locator('#selection-progress')).toContainText('0 / 1 slots');
        await expectPreviousPicksTab(cslHeadPage, 1, [
          /Candidate, Patient/u,
          /202012346/u,
          /patient\.student@up\.edu\.ph/u,
        ]);
      });

      test('selects PartialToDrafted', async ({ cslHeadPage }) => {
        await cslHeadPage.goto('/dashboard/students/');
        await expect(cslHeadPage.getByRole('button', { name: /Partial/u })).toBeVisible();
        await cslHeadPage.getByRole('button', { name: /Partial/u }).click();
        await expect(cslHeadPage.locator('li[data-selected="true"]')).toHaveCount(1);
        await expect(cslHeadPage.locator('li[data-selected="true"]')).toContainText(/Partial/u);
        await expect(cslHeadPage.locator('#selection-progress')).toHaveText(/1 \/ 1 slots/u);
        cslHeadPage.on('dialog', dialog => dialog.accept());
        const responsePromise = cslHeadPage.waitForResponse('/dashboard/students/?/rankings');
        await cslHeadPage.getByRole('button', { name: 'Submit Selection' }).click();
        const response = await responsePromise;
        const responseData = await response.json();
        expect(responseData.type).toBe('success');

        await expectStudentsCallout(
          cslHeadPage,
          'This lab has no more draft slots remaining for the rest of this draft.',
        );
        await expectPreviousPicksTab(cslHeadPage, 2, [/Partial/u]);
      });
    });

    test.describe('CVMIL', () => {
      test('stat cards unchanged, no Previous Picks', async ({ cvmilHeadPage }) => {
        await cvmilHeadPage.goto('/dashboard/students/');
        await expectStatCards(cvmilHeadPage, { quota: 1, remaining: 1, drafted: 0 });
        await expectNoPreviousPicks(cvmilHeadPage);
      });

      test('skips (sees Persistent, Unlucky)', async ({ cvmilHeadPage }) => {
        await cvmilHeadPage.goto('/dashboard/students/');
        await expect(cvmilHeadPage.getByRole('button', { name: /Persistent/u })).toBeVisible();
        await expect(cvmilHeadPage.getByRole('button', { name: /Unlucky/u })).toBeVisible();
        cvmilHeadPage.on('dialog', dialog => dialog.accept());
        const responsePromise = cvmilHeadPage.waitForResponse('/dashboard/students/?/rankings');
        await cvmilHeadPage.getByRole('button', { name: 'Submit Selection' }).click();
        const response = await responsePromise;
        const responseData = await response.json();
        expect(responseData.type).toBe('success');

        await expectStudentsCallout(
          cvmilHeadPage,
          'No undrafted students have selected this lab in this round.',
          ['This lab has no more draft slots remaining for the rest of this draft.'],
        );
      });
    });
  });

  test.describe('Verify Round 3', () => {
    test('draft is now in Round 3', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await expect(adminPage.getByText(/Round 3/u).first()).toBeVisible();
      await expectRegularStudentsContents(
        adminPage,
        'Already Drafted',
        [/202012345/u, /202012346/u, /202012349/u],
        [/202012348/u, /202012350/u],
      );
    });
  });

  test.describe('Round 3 — 3rd choice', () => {
    // CSL: quota full (2/2) → auto-acknowledged
    // SCL: Eager ranked SCL 3rd, but Eager is drafted → no undrafted students → auto-acknowledged
    // CVMIL: no 3rd-choice students → auto-acknowledged

    test.describe('NDSL', () => {
      test('before submission: Previous Picks Round 1 with Eager', async ({ ndslHeadPage }) => {
        await ndslHeadPage.goto('/dashboard/students/');
        await expectStatCards(ndslHeadPage, { quota: 2, remaining: 1, drafted: 1 });
        await expect(ndslHeadPage.locator('#selection-progress')).toContainText('0 / 1 slots');
        await expectPreviousPicksTab(ndslHeadPage, 1, [
          /Draftee, Eager/u,
          /202012345/u,
          /eager\.student@up\.edu\.ph/u,
        ]);
      });

      test('selects Unlucky', async ({ ndslHeadPage }) => {
        await ndslHeadPage.goto('/dashboard/students/');
        await expect(ndslHeadPage.getByRole('button', { name: /Unlucky/u })).toBeVisible();
        await ndslHeadPage.getByRole('button', { name: /Unlucky/u }).click();
        await expect(ndslHeadPage.locator('li[data-selected="true"]')).toHaveCount(1);
        await expect(ndslHeadPage.locator('li[data-selected="true"]')).toContainText(/Unlucky/u);
        await expect(ndslHeadPage.locator('#selection-progress')).toHaveText(/1 \/ 1 slots/u);
        ndslHeadPage.on('dialog', dialog => dialog.accept());
        const responsePromise = ndslHeadPage.waitForResponse('/dashboard/students/?/rankings');
        await ndslHeadPage.getByRole('button', { name: 'Submit Selection' }).click();
        const response = await responsePromise;
        const responseData = await response.json();
        expect(responseData.type).toBe('success');

        await expectStudentsCallout(
          ndslHeadPage,
          'This lab has no more draft slots remaining for the rest of this draft.',
        );
        await expectPreviousPicksTab(ndslHeadPage, 3, [/Unlucky/u]);
      });
    });

    test.describe('CSL', () => {
      test('quota-exhausted: no slots remaining', async ({ cslHeadPage }) => {
        await expectStudentsCallout(
          cslHeadPage,
          'This lab has no more draft slots remaining for the rest of this draft.',
          ['No undrafted students have selected this lab in this round.'],
          { title: 'No Slots Remaining' },
        );
      });

      test('server rejects forced updates after quota-exhausted auto-acknowledgement', async ({
        cslHeadPage,
      }) => {
        await cslHeadPage.goto('/dashboard/students/');
        const status = await postFacultyRankings(cslHeadPage, 1, 3);

        expect(status).toBe(409);
      });

      test('stat cards: quota exhausted, Previous Picks with Patient and PartialToDrafted', async ({
        cslHeadPage,
      }) => {
        await cslHeadPage.goto('/dashboard/students/');
        await expectStatCards(cslHeadPage, { quota: 2, remaining: 0, drafted: 2 });
        await expectPreviousPicksTab(cslHeadPage, 1, [
          /Candidate, Patient/u,
          /202012346/u,
          /patient\.student@up\.edu\.ph/u,
        ]);
        await expectPreviousPicksTab(cslHeadPage, 2, [
          /ToDrafted, Partial/u,
          /202012349/u,
          /partial-drafted\.student@up\.edu\.ph/u,
        ]);
      });
    });

    test.describe('SCL', () => {
      test('auto-acknowledged: no-preferences message', async ({ sclHeadPage }) => {
        await expectStudentsCallout(
          sclHeadPage,
          'No undrafted students have selected this lab in this round.',
          ['This lab has no more draft slots remaining for the rest of this draft.'],
          { title: 'No Student Preferences This Round' },
        );
      });

      test('stat cards unchanged, no researchers', async ({ sclHeadPage }) => {
        await sclHeadPage.goto('/dashboard/students/');
        await expectStatCards(sclHeadPage, { quota: 2, remaining: 2, drafted: 0 });
      });
    });

    test.describe('CVMIL', () => {
      test('auto-acknowledged: no-preferences message', async ({ cvmilHeadPage }) => {
        await expectStudentsCallout(
          cvmilHeadPage,
          'No undrafted students have selected this lab in this round.',
          ['This lab has no more draft slots remaining for the rest of this draft.'],
          { title: 'No Student Preferences This Round' },
        );
      });

      test('stat cards unchanged, no researchers', async ({ cvmilHeadPage }) => {
        await cvmilHeadPage.goto('/dashboard/students/');
        await expectStatCards(cvmilHeadPage, { quota: 1, remaining: 1, drafted: 0 });
      });
    });

    test.describe('ACL', () => {
      test('stat cards unchanged, no Previous Picks', async ({ aclHeadPage }) => {
        await aclHeadPage.goto('/dashboard/students/');
        await expectStatCards(aclHeadPage, { quota: 1, remaining: 1, drafted: 0 });
        await expectNoPreviousPicks(aclHeadPage);
      });

      test('skips (sees Persistent)', async ({ aclHeadPage }) => {
        await aclHeadPage.goto('/dashboard/students/');
        await expect(aclHeadPage.getByRole('button', { name: /Persistent/u })).toBeVisible();
        aclHeadPage.on('dialog', dialog => dialog.accept());
        const responsePromise = aclHeadPage.waitForResponse('/dashboard/students/?/rankings');
        await aclHeadPage.getByRole('button', { name: 'Submit Selection' }).click();
        const response = await responsePromise;
        const responseData = await response.json();
        expect(responseData.type).toBe('success');

        await expectStudentsCallout(
          aclHeadPage,
          'The draft is now in the lottery stage. Kindly contact the draft administrators on how to proceed.',
        );
      });
    });
  });

  test.describe('History During Lottery', () => {
    test('shows Draft #1 in lottery phase', async ({ page }) => {
      await page.goto('/history/');
      await expect(page.getByText('Draft #1')).toBeVisible();
      await expect(page.getByText(/lottery stage/u)).toBeVisible();
    });

    test('admin lottery page shows loader labels and intervention action', async ({
      adminPage,
    }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await expect(
        adminPage.getByRole('heading', { name: 'Interventions', exact: true }),
      ).toBeVisible();
      await expectVisibleButtons(adminPage, ['Eligible for Lottery', 'See Drafted']);

      await adminPage.getByRole('button', { name: 'Eligible for Lottery' }).first().click();
      await expect(adminPage.getByRole('button', { name: 'Apply Interventions' })).toBeVisible();
    });

    test('detail page shows ordered round events', async ({ page }) => {
      const texts = await getHistoryTimelineTexts(page, 1);
      await expect(page.getByText('lottery stage')).toBeVisible();

      function idx(regex: RegExp) {
        return texts.findIndex(t => regex.test(t));
      }

      // No finalized event yet
      expect(idx(/was finalized/u)).toBe(-1);

      // Known faculty selections exist
      const anyRound3Batch = idx(/3rd batch/iu);
      const anyRound2Batch = idx(/2nd batch/iu);
      const anyRound1Batch = idx(/1st batch/iu);
      expect(anyRound3Batch).toBeGreaterThanOrEqual(0);
      expect(anyRound2Batch).toBeGreaterThanOrEqual(0);
      expect(anyRound1Batch).toBeGreaterThanOrEqual(0);

      // Round 3 selections before Round 2 before Round 1 (DESC order)
      expect(anyRound3Batch).toBeLessThan(anyRound2Batch);
      expect(anyRound2Batch).toBeLessThan(anyRound1Batch);
      // Entries are grouped by second; intra-second ordering can vary.

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

      // Creation is last
      expect(idx(/was created/u)).toBe(texts.length - 1);
    });
  });

  test.describe('Lottery Phase', () => {
    test('draft enters lottery phase', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await expect(adminPage.getByRole('heading', { name: 'Interventions Phase' })).toBeVisible();
      await expectSheetContents(
        adminPage,
        'See Drafted',
        [/202012345/u, /202012346/u, /202012349/u, /202012348/u],
        [/202012350/u, /202012351/u],
      );
    });

    test('eligible for lottery does not fetch before the sheet opens', async ({ adminPage }) => {
      const noResponseBeforeOpen = expect(
        adminPage.waitForResponse(
          response => new URL(response.url()).pathname === '/dashboard/drafts/1/draftees',
          { timeout: 1000 },
        ),
      ).rejects.toThrow();

      await adminPage.goto('/dashboard/drafts/1/');
      await expectVisibleButtons(adminPage, ['Eligible for Lottery']);
      await adminPage.waitForLoadState('networkidle');
      await noResponseBeforeOpen;
    });

    test('eligible for lottery fetches when the sheet opens', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await expectVisibleButtons(adminPage, ['Eligible for Lottery']);
      const responsePromise = adminPage.waitForResponse(
        response => new URL(response.url()).pathname === '/dashboard/drafts/1/draftees',
      );
      await adminPage.getByRole('button', { name: 'Eligible for Lottery' }).first().click();
      await responsePromise;
    });
  });

  test.describe('Faculty Lottery Phase', () => {
    test('sees lottery pending message', async ({ ndslHeadPage }) => {
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
    });

    test('NDSL sees Previous Picks with Round 1 and Round 3', async ({ ndslHeadPage }) => {
      await ndslHeadPage.goto('/dashboard/students/');
      await expectPreviousPicksTab(ndslHeadPage, 1, [
        /Draftee, Eager/u,
        /202012345/u,
        /eager\.student@up\.edu\.ph/u,
      ]);
      await expectPreviousPicksTab(ndslHeadPage, 3, [
        /FullRanker, Unlucky/u,
        /202012348/u,
        /unlucky\.student@up\.edu\.ph/u,
      ]);
    });
  });

  test.describe('Conclude Error Case', () => {
    test('conclude fails with mismatched quota', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      adminPage.on('dialog', dialog => dialog.accept());

      await expect(adminPage.getByRole('button', { name: 'Run Lottery' })).toBeVisible();
      const responsePromise = adminPage.waitForResponse('/dashboard/drafts/1/?/conclude');
      await adminPage.getByRole('button', { name: 'Run Lottery' }).click();

      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('failure');
      expect(responseData.status).toBe(403);

      // Page stays on lottery — button re-enables
      await expect(adminPage.getByRole('button', { name: 'Run Lottery' })).toBeEnabled();
    });
  });

  test.describe('Manual Intervention', () => {
    test('assigns first eligible student to a lab', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await adminPage.getByRole('button', { name: 'Eligible for Lottery' }).first().click();
      const interventionForm = adminPage.locator('form[action*="intervene"]');
      await expect(interventionForm).toBeVisible();

      // Each student row has a <select name={userId}> — pick the first one and assign to index 1
      const selects = interventionForm.locator('select');
      await selects.first().selectOption({ index: 1 });

      adminPage.on('dialog', dialog => dialog.accept());
      const responsePromise = adminPage.waitForResponse('/dashboard/drafts/1/?/intervene');
      await adminPage.getByRole('button', { name: 'Apply Interventions' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });
  });

  test.describe('Adjust Quotas for Remaining Students', () => {
    test.describe('lottery snapshot updates', () => {
      test('partially updates lottery snapshots', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/drafts/1/');
        await adminPage.getByRole('button', { name: 'Eligible for Lottery' }).first().click();
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
        const responseData = await response.json();
        expect(responseData.type).toBe('success');
      });

      test('shows committed placeholders after lottery snapshot update', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/drafts/1/');
        await adminPage.getByRole('button', { name: 'Eligible for Lottery' }).first().click();
        const editor = adminPage.locator('#draft-quota-editor-lottery');
        await expect(editor).toBeVisible();

        const aclInput = editor.locator('input[name="acl"]');
        await expect(aclInput).toHaveValue('');
        await expect(aclInput).toHaveAttribute('placeholder', '1');

        const ndslInput = editor.locator('input[name="ndsl"]');
        await expect(ndslInput).toHaveValue('');
        await expect(ndslInput).toHaveAttribute('placeholder', '0');
      });
    });
  });

  test.describe('Run Lottery', () => {
    test('runs lottery successfully', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      adminPage.on('dialog', dialog => dialog.accept());

      await expect(adminPage.getByRole('button', { name: 'Run Lottery' })).toBeVisible();
      const responsePromise = adminPage.waitForResponse('/dashboard/drafts/1/?/conclude');
      await adminPage.getByRole('button', { name: 'Run Lottery' }).click();

      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('enters review phase with finalize action', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await expect(adminPage.getByText(/Started .* · Review/u)).toBeVisible();
      await expect(adminPage.getByRole('heading', { name: 'Review Phase' })).toHaveCount(0);
      await expect(adminPage.getByRole('heading', { name: 'Lottery Phase' })).toHaveCount(0);
      await expect(adminPage.getByRole('button', { name: 'Finalize Draft' })).toBeVisible();
      await expect(adminPage.getByRole('button', { name: 'View Undrafted' })).toHaveCount(0);
    });
  });

  test.describe('Faculty Review Phase', () => {
    test('sees review pending message', async ({ ndslHeadPage }) => {
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
    });

    test('NDSL sees Previous Picks with Round 1 and Round 3', async ({ ndslHeadPage }) => {
      await ndslHeadPage.goto('/dashboard/students/');
      await expectPreviousPicksTab(ndslHeadPage, 1, [
        /Draftee, Eager/u,
        /202012345/u,
        /eager\.student@up\.edu\.ph/u,
      ]);
      await expectPreviousPicksTab(ndslHeadPage, 3, [
        /FullRanker, Unlucky/u,
        /202012348/u,
        /unlucky\.student@up\.edu\.ph/u,
      ]);
    });
  });

  test.describe('Finalize Draft', () => {
    test('finalizes draft successfully', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      adminPage.on('dialog', dialog => dialog.accept());

      await expect(adminPage.getByRole('button', { name: 'Finalize Draft' })).toBeVisible();
      const responsePromise = adminPage.waitForResponse('/dashboard/drafts/1/?/finalize');
      await adminPage.getByRole('button', { name: 'Finalize Draft' }).click();

      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });
  });

  test.describe('Admin Finalized Breakdown', () => {
    test('shows expected stat card values', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');

      await expect(adminPage.locator('#stat-total-students')).toHaveText('8');
      await expect(adminPage.locator('#stat-participating-labs')).toHaveText('5');
    });

    test.describe('Draft Rounds Chart', () => {
      test('renders the chart with every finalized phase label', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/drafts/1/');
        const chart = adminPage.locator('#draft-rounds-chart');

        await expect(chart).toBeVisible();
        await expect(chart).toContainText('R1');
        await expect(chart).toContainText('R2');
        await expect(chart).toContainText('R3');
        await expect(chart).toContainText('Interventions');
        await expect(chart).toContainText('Lottery');
      });

      test('updates the chart title and tooltip for the selected metric', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/drafts/1/');

        const title = adminPage.locator('#draft-rounds-chart-title');
        const modeSelect = adminPage.locator('#draft-rounds-chart-mode');

        await expect(title).toHaveText('Students Assigned per Phase');
        await expectChartTooltipPoint(adminPage, 0, {
          label: 'Round 1',
          metric: 'Assigned',
          value: 2,
          hiddenMetrics: ['Not Yet Assigned', 'Remaining Quota'],
        });
        await expectChartTooltipPoint(adminPage, 1, {
          label: 'Round 2',
          metric: 'Assigned',
          value: 1,
          hiddenMetrics: ['Not Yet Assigned', 'Remaining Quota'],
        });
        await expectChartTooltipPoint(adminPage, 2, {
          label: 'Round 3',
          metric: 'Assigned',
          value: 1,
          hiddenMetrics: ['Not Yet Assigned', 'Remaining Quota'],
        });
        await expectChartTooltipPoint(adminPage, 3, {
          label: 'Interventions',
          metric: 'Assigned',
          value: 1,
          hiddenMetrics: ['Not Yet Assigned', 'Remaining Quota'],
        });
        await expectChartTooltipPoint(adminPage, 4, {
          label: 'Lottery',
          metric: 'Assigned',
          value: 3,
          hiddenMetrics: ['Not Yet Assigned', 'Remaining Quota'],
        });

        await modeSelect.selectOption('remaining');

        await expect(title).toHaveText('Students Not Yet Assigned per Phase');
        await expectChartTooltipPoint(adminPage, 0, {
          label: 'Round 1',
          metric: 'Not Yet Assigned',
          value: 6,
          hiddenMetrics: ['Assigned', 'Remaining Quota'],
        });
        await expectChartTooltipPoint(adminPage, 1, {
          label: 'Round 2',
          metric: 'Not Yet Assigned',
          value: 5,
          hiddenMetrics: ['Assigned', 'Remaining Quota'],
        });
        await expectChartTooltipPoint(adminPage, 2, {
          label: 'Round 3',
          metric: 'Not Yet Assigned',
          value: 4,
          hiddenMetrics: ['Assigned', 'Remaining Quota'],
        });
        await expectChartTooltipPoint(adminPage, 3, {
          label: 'Interventions',
          metric: 'Not Yet Assigned',
          value: 3,
          hiddenMetrics: ['Assigned', 'Remaining Quota'],
        });
        await expectChartTooltipPoint(adminPage, 4, {
          label: 'Lottery',
          metric: 'Not Yet Assigned',
          value: 0,
          hiddenMetrics: ['Assigned', 'Remaining Quota'],
        });
      });

      test('keeps every phase label visible when filtering to a specific lab', async ({
        adminPage,
      }) => {
        await adminPage.goto('/dashboard/drafts/1/');

        const chart = adminPage.locator('#draft-rounds-chart');
        const title = adminPage.locator('#draft-rounds-chart-title');
        const modeSelect = adminPage.locator('#draft-rounds-chart-mode');
        const labSelect = adminPage.locator('#draft-rounds-chart-lab');
        const selectedLab = await labSelect
          .locator('option')
          .nth(1)
          .evaluate(node => ({
            label: node.textContent?.trim() ?? '',
            value: node.getAttribute('value') ?? '',
          }));

        await labSelect.selectOption(selectedLab.value);

        await expect(chart).toContainText('R1');
        await expect(chart).toContainText('R2');
        await expect(chart).toContainText('R3');
        await expect(chart).toContainText('Interventions');
        await expect(chart).toContainText('Lottery');

        await modeSelect.selectOption('remaining');

        await expect(title).toHaveText('Labs Remaining Quota per Phase');
      });
    });

    test.describe('Supply Demand Chart', () => {
      test('renders with all lab IDs and series legend', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/drafts/1/');
        const chart = adminPage.locator('#supply-demand-chart');
        await expect(chart).toBeVisible();

        // Y-axis: all 5 lab IDs
        await expect(chart).toContainText('NDSL');
        await expect(chart).toContainText('CSL');
        await expect(chart).toContainText('SCL');
        await expect(chart).toContainText('CVMIL');
        await expect(chart).toContainText('ACL');

        // Legend: 3 grouped series
        const legendItems = chart.locator('.lc-legend-swatch-button');
        await expect(legendItems).toHaveCount(3);
        await expect(chart).toContainText('Supply');
        await expect(chart).toContainText('Demand');
        await expect(chart).toContainText('Actual');
      });

      test('x-axis displays percentage labels', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/drafts/1/');
        const chart = adminPage.locator('#supply-demand-chart');
        await expect(chart).toContainText('0%');
      });
    });

    test.describe('Lab Distribution Chart', () => {
      test('renders with all five lab IDs in legend', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/drafts/1/');
        const chart = adminPage.locator('#lab-distribution-chart');
        await expect(chart).toBeVisible();

        // All 8 students assigned across exactly 5 labs
        const legendItems = chart.locator('.lc-legend-swatch-button');
        await expect(legendItems).toHaveCount(5);
        await expect(chart).toContainText('NDSL');
        await expect(chart).toContainText('CSL');
        await expect(chart).toContainText('SCL');
        await expect(chart).toContainText('CVMIL');
        await expect(chart).toContainText('ACL');
      });

      test('has no Unassigned slice', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/drafts/1/');
        const chart = adminPage.locator('#lab-distribution-chart');
        await expect(chart.getByText('Unassigned')).toHaveCount(0);
      });
    });

    test.describe('Preference Alignment Chart', () => {
      test('legend contains all deterministic preference slices', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/drafts/1/');
        const chart = adminPage.locator('#preference-alignment-chart');
        await expect(chart).toBeVisible();

        // Always present regardless of lottery outcome:
        // 1st Choice: Eager→NDSL, Patient→CSL
        // 2nd Choice: PartialToDrafted→CSL
        // 3rd Choice: Unlucky→NDSL
        // Not Preferred: NoRank + IdleBystander (0 prefs)
        await expect(chart).toContainText('1st Choice');
        await expect(chart).toContainText('2nd Choice');
        await expect(chart).toContainText('3rd Choice');
        await expect(chart).toContainText('Not Preferred');
      });

      test('displays a valid Borda Score in the center overlay', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/drafts/1/');
        const chart = adminPage.locator('#preference-alignment-chart');

        await expect(chart).toContainText('Borda Score');

        // d3-format('.1~%') renders whole or fractional percentages such as "42%" or "37.5%".
        const scoreEl = chart.locator('.text-3xl');
        await expect(scoreEl).toHaveText(/^\d+(?:\.\d+)?%$/u);

        // Verify range 0–100%
        const scoreText = (await scoreEl.textContent())?.trim() ?? '';
        const numeric = Number.parseFloat(scoreText.replace('%', ''));
        expect(numeric).toBeGreaterThanOrEqual(0);
        expect(numeric).toBeLessThanOrEqual(100);
      });
    });

    test.describe('drafted sections', () => {
      test('are ordered as regular then intervention then lottery', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/drafts/1/');

        await adminPage.getByRole('button', { name: 'See Results' }).click();
        await adminPage.waitForLoadState('networkidle');

        const sectionIds = await adminPage
          .locator(
            '#section-regular-drafted, #section-intervention-drafted, #section-lottery-drafted',
          )
          .evaluateAll(nodes => nodes.map(node => node.id));
        await expect(sectionIds).toEqual([
          'section-regular-drafted',
          'section-intervention-drafted',
          'section-lottery-drafted',
        ]);
      });

      test('show expected section counts', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/drafts/1/');

        await adminPage.getByRole('button', { name: 'See Results' }).click();
        await adminPage.waitForLoadState('networkidle');

        await expect(adminPage.locator('#section-regular-drafted')).toContainText(
          'Regular Drafted (4)',
        );
        await expect(adminPage.locator('#section-intervention-drafted')).toContainText(
          'Intervention Drafted (1)',
        );
        await expect(adminPage.locator('#section-lottery-drafted')).toContainText(
          'Lottery Drafted (3)',
        );
      });

      test('show intervention assignment dates', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/drafts/1/');

        await adminPage.getByRole('button', { name: 'See Results' }).click();
        await adminPage.waitForLoadState('networkidle');

        const firstInterventionDate = adminPage.locator('[id^="intervention-date-"]').first();
        await expect(firstInterventionDate).toBeVisible();
        const interventionDateText = (await firstInterventionDate.textContent())?.trim() ?? '';
        expect(interventionDateText.length).toBeGreaterThan(0);
      });
    });
  });

  test.describe('History After Finalization', () => {
    test('shows Draft #1 as finalized', async ({ page }) => {
      await page.goto('/history/');
      await expect(page.getByText('Draft #1')).toBeVisible();
      await expect(page.getByText(/was held from/u)).toBeVisible();
      await expect(page.getByText(/over 3 rounds/u)).toBeVisible();
    });

    test.describe('Draft #1 detail timeline', () => {
      test('shows finalized status banner', async ({ page }) => {
        await page.goto('/history/1/');
        await expect(page.getByText(/was held from/u)).toBeVisible();
        await expect(page.getByText(/over 3 rounds/u)).toBeVisible();
      });

      test('keeps timeline boundary events in place', async ({ page }) => {
        const texts = await getHistoryTimelineTexts(page, 1);

        function idx(regex: RegExp) {
          return texts.findIndex(text => regex.test(text));
        }

        expect(idx(/was finalized/u)).toBe(0);
        expect(idx(/was created/u)).toBe(texts.length - 1);
      });

      test('orders lottery and faculty round events correctly', async ({ page }) => {
        const texts = await getHistoryTimelineTexts(page, 1);

        function idx(regex: RegExp) {
          return texts.findIndex(text => regex.test(text));
        }

        const firstLottery = idx(/obtained a batch.*lottery/isu);
        const anyRound3Batch = idx(/3rd batch/iu);
        const anyRound2Batch = idx(/2nd batch/iu);
        const anyRound1Batch = idx(/1st batch/iu);

        expect(firstLottery).toBeGreaterThan(0);
        expect(firstLottery).toBeLessThan(anyRound3Batch);
        expect(anyRound3Batch).toBeLessThan(anyRound2Batch);
        expect(anyRound2Batch).toBeLessThan(anyRound1Batch);
      });

      test('distinguishes intervention picks from lottery picks', async ({ page }) => {
        const texts = await getHistoryTimelineTexts(page, 1);

        function idx(regex: RegExp) {
          return texts.findIndex(text => regex.test(text));
        }

        const interventionIndex = idx(/manual lottery intervention/iu);
        const lotteryIndex = idx(/lottery randomization/iu);

        expect(interventionIndex).toBeGreaterThanOrEqual(0);
        expect(lotteryIndex).toBeGreaterThanOrEqual(0);
        expect(texts[interventionIndex]).not.toEqual(texts[lotteryIndex]);
      });

      test('shows intervention and lottery events only for labs with actual assignments', async ({
        page,
      }) => {
        const texts = await getHistoryTimelineTexts(page, 1);

        const interventionEntries = texts.filter(text =>
          /manual lottery intervention/iu.test(text),
        );
        const lotteryEntries = texts.filter(text => /lottery randomization/iu.test(text));

        expect(interventionEntries).toHaveLength(1);
        expect(lotteryEntries).toHaveLength(3);
        expect(
          texts.some(text =>
            /NDSL.*(?:manual lottery intervention|lottery randomization)/iu.test(text),
          ),
        ).toBe(false);
      });

      test('keeps internal events between finalized and created boundaries', async ({ page }) => {
        const texts = await getHistoryTimelineTexts(page, 1);

        function idx(regex: RegExp) {
          return texts.findIndex(text => regex.test(text));
        }

        const finalizedIndex = idx(/was finalized/u);
        const createdIndex = idx(/was created/u);
        const internalEventIndex = idx(
          /selected their|obtained a batch of draftees|system has skipped/isu,
        );

        expect(internalEventIndex).toBeGreaterThan(finalizedIndex);
        expect(internalEventIndex).toBeLessThan(createdIndex);
      });

      test('includes the full auto-acknowledged skip set', async ({ page }) => {
        const texts = await getHistoryTimelineTexts(page, 1);
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
      });
    });
  });

  test.describe('Drafts Table Final State', () => {
    test('shows draft with finalized status', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/');
      await expect(adminPage.getByText('#1')).toBeVisible();
      await expect(adminPage.getByText('Finalized')).toBeVisible();
    });
  });

  // Post-condition: Verify student assignments
  test.describe('Student Final States', () => {
    test('Eager sees NDSL assignment (Round 1, 1st choice)', async ({ eagerDrafteePage }) => {
      await eagerDrafteePage.goto('/dashboard/student/');
      await expect(
        eagerDrafteePage.getByText(/Networks and Distributed Systems Laboratory/u),
      ).toBeVisible();
    });

    test('Patient sees CSL assignment (Round 1, 1st choice)', async ({ patientCandidatePage }) => {
      await patientCandidatePage.goto('/dashboard/student/');
      await expect(patientCandidatePage.getByText(/Computer Security Laboratory/u)).toBeVisible();
    });

    test('Unlucky sees NDSL assignment (Round 3, 3rd choice)', async ({
      unluckyFullRankerPage,
    }) => {
      await unluckyFullRankerPage.goto('/dashboard/student/');
      await expect(
        unluckyFullRankerPage.getByText(/Networks and Distributed Systems Laboratory/u),
      ).toBeVisible();
    });

    test('PartialToDrafted sees CSL assignment (Round 2, 2nd choice)', async ({
      partialToDraftedPage,
    }) => {
      await partialToDraftedPage.goto('/dashboard/student/');
      await expect(partialToDraftedPage.getByText(/Computer Security Laboratory/u)).toBeVisible();
    });

    test('Persistent sees lab assignment (lottery)', async ({ persistentHopefulPage }) => {
      await persistentHopefulPage.goto('/dashboard/student/');
      // No lab picked Persistent in any round; assigned via lottery
      await expect(persistentHopefulPage.getByText(/Laboratory/u)).toBeVisible();
    });

    test('PartialToLottery sees lab assignment (lottery)', async ({ partialToLotteryPage }) => {
      await partialToLotteryPage.goto('/dashboard/student/');
      // Should have some lab assignment from lottery
      await expect(partialToLotteryPage.getByText(/Laboratory/u)).toBeVisible();
    });

    test('NoRank sees lab assignment (lottery)', async ({ noRankStudentPage }) => {
      await noRankStudentPage.goto('/dashboard/student/');
      await expect(noRankStudentPage.getByText(/Laboratory/u)).toBeVisible();
    });

    test('Idle sees lab assignment (lottery)', async ({ idleBystanderPage }) => {
      await idleBystanderPage.goto('/dashboard/student/');
      await expect(idleBystanderPage.getByText(/Laboratory/u)).toBeVisible();
    });

    test('Late registrant has no assignment', async ({ lateRegistrantPage }) => {
      await lateRegistrantPage.goto('/dashboard/student/');
      // Late registrant missed registration — draft is finalized so no active draft
      await expect(lateRegistrantPage.getByText('No Active Draft')).toBeVisible();
    });
  });

  // Post-condition: Verify faculty see their new members
  test.describe('Faculty Final States', () => {
    test('NDSL sees 2 assigned students (Eager, Unlucky)', async ({ ndslHeadPage }) => {
      await ndslHeadPage.goto('/dashboard/lab/');
      // Expand the draft accordion to reveal members
      await ndslHeadPage.getByRole('button', { name: /Draft 1/u }).click();
      await expect(ndslHeadPage.getByText(/Eager/u)).toBeVisible();
      await expect(ndslHeadPage.getByText(/Unlucky/u)).toBeVisible();
    });

    test('CSL sees 2 assigned students (Patient, PartialToDrafted)', async ({ cslHeadPage }) => {
      await cslHeadPage.goto('/dashboard/lab/');
      await cslHeadPage.getByRole('button', { name: /Draft 1/u }).click();
      await expect(cslHeadPage.getByText(/Patient/u)).toBeVisible();
      await expect(cslHeadPage.getByText(/Partial/u)).toBeVisible();
    });
  });

  test.describe('Second Draft — Archive And Setup', () => {
    test.describe('ACL archival before Draft #2', () => {
      test('archives ACL', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/labs/');

        const aclRow = adminPage
          .locator('tbody tr')
          .filter({ hasText: 'Algorithms and Complexity Laboratory' });
        await expect(aclRow).toBeVisible();

        const responsePromise = adminPage.waitForResponse('/dashboard/labs/?/archive');
        await aclRow.getByRole('button').click();
        const response = await responsePromise;
        const responseData = await response.json();
        expect(responseData.type).toBe('success');
      });

      test('shows ACL in archived labs', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/labs/');
        await adminPage.getByRole('tab', { name: /Archived Labs/u }).click();
        await expect(adminPage.getByText('Algorithms and Complexity Laboratory')).toBeVisible();
      });
    });

    test('creates Draft #2 with 2 rounds', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/');
      await adminPage.getByRole('button', { name: 'Create Draft' }).click();

      const dialog = adminPage.getByRole('dialog');
      await expect(dialog).toBeVisible();

      const formattedDate = addDays(new Date(), 1).toISOString().slice(0, 16);

      await dialog.locator('input#closesAt').fill(formattedDate);
      await dialog.locator('input#rounds').fill('2');

      adminPage.on('dialog', async dialog => await dialog.accept());
      const responsePromise = adminPage.waitForResponse('/dashboard/drafts/?/init');
      await dialog.getByRole('button', { name: 'Create Draft' }).click();

      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');

      await expect(adminPage.getByText('#2')).toBeVisible();
      await expect(adminPage.getByText('Registration')).toBeVisible();
    });

    test('rejects quota updates for unsnapshotted labs', async ({ adminPage }) => {
      const status = await adminPage.evaluate(async () => {
        const data = new FormData();
        data.set('draft', '2');
        data.set('kind', 'initial');
        data.set('acl', '1');
        const response = await fetch('/dashboard/drafts/2/?/quota', {
          method: 'POST',
          body: data,
        });
        return response.status;
      });
      expect(status).toBe(400);
    });
  });

  test.describe('Second Draft — Snapshot Integrity', () => {
    test.describe('snapshot guard student', () => {
      test('registration does not show archived lab', async ({ snapshotGuardStudentPage }) => {
        await snapshotGuardStudentPage.goto('/dashboard/student/');
        await snapshotGuardStudentPage.getByLabel('Student Number').fill('202112399');

        const profileResponsePromise =
          snapshotGuardStudentPage.waitForResponse('/dashboard/?/profile');
        await snapshotGuardStudentPage.getByRole('button', { name: 'Complete Profile' }).click();
        const profileResponse = await profileResponsePromise;
        const profileResponseData = await profileResponse.json();
        expect(profileResponseData.type).toBe('success');

        await expect(snapshotGuardStudentPage.getByText('Select Lab Preference')).toBeVisible();
        await expect(
          snapshotGuardStudentPage.getByRole('button', {
            name: 'Algorithms and Complexity Laboratory',
          }),
        ).toHaveCount(0);
      });

      test('forged archived-lab submission is rejected', async ({ snapshotGuardStudentPage }) => {
        await snapshotGuardStudentPage.goto('/dashboard/student/');
        const status = await snapshotGuardStudentPage.evaluate(async () => {
          const data = new FormData();
          data.set('draft', '2');
          data.append('labs', 'acl');
          data.append('remarks', '');
          const response = await fetch('/dashboard/student/?/submit', {
            method: 'POST',
            body: data,
          });
          return response.status;
        });
        expect(status).toBe(400);
      });
    });
  });

  test.describe('Second Draft — Student Registration', () => {
    test.describe('SecondNdslFirstChoice (NDSL > CSL)', () => {
      test('completes profile', async ({ secondRoundNdslFirstChoicePage }) => {
        await secondRoundNdslFirstChoicePage.goto('/dashboard/student/');
        await secondRoundNdslFirstChoicePage.getByLabel('Student Number').fill('202112360');
        const profileResponsePromise =
          secondRoundNdslFirstChoicePage.waitForResponse('/dashboard/?/profile');
        await secondRoundNdslFirstChoicePage
          .getByRole('button', { name: 'Complete Profile' })
          .click();
        const profileResponse = await profileResponsePromise;
        const profileResponseData = await profileResponse.json();
        expect(profileResponseData.type).toBe('success');
      });

      test('submits rankings', async ({ secondRoundNdslFirstChoicePage }) => {
        await secondRoundNdslFirstChoicePage.goto('/dashboard/student/');
        await secondRoundNdslFirstChoicePage
          .getByRole('button', { name: 'Networks and Distributed Systems Laboratory' })
          .click();
        await secondRoundNdslFirstChoicePage
          .getByRole('button', { name: 'Computer Security Laboratory' })
          .click();

        await secondRoundNdslFirstChoicePage.getByLabel('Photo Consent').selectOption('google');
        secondRoundNdslFirstChoicePage.on('dialog', dialog => dialog.accept());
        const responsePromise = secondRoundNdslFirstChoicePage.waitForResponse(
          '/dashboard/student/?/submit',
        );
        await secondRoundNdslFirstChoicePage
          .getByRole('button', { name: 'Submit Lab Preferences' })
          .click();
        const response = await responsePromise;
        const responseData = await response.json();
        expect(responseData.type).toBe('success');
      });
    });

    test.describe('SecondCslFirstChoice (CSL > NDSL)', () => {
      test('completes profile', async ({ secondRoundCslFirstChoicePage }) => {
        await secondRoundCslFirstChoicePage.goto('/dashboard/student/');
        await secondRoundCslFirstChoicePage.getByLabel('Student Number').fill('202112361');
        const profileResponsePromise =
          secondRoundCslFirstChoicePage.waitForResponse('/dashboard/?/profile');
        await secondRoundCslFirstChoicePage
          .getByRole('button', { name: 'Complete Profile' })
          .click();
        const profileResponse = await profileResponsePromise;
        const profileResponseData = await profileResponse.json();
        expect(profileResponseData.type).toBe('success');
      });

      test('submits rankings', async ({ secondRoundCslFirstChoicePage }) => {
        await secondRoundCslFirstChoicePage.goto('/dashboard/student/');
        await secondRoundCslFirstChoicePage
          .getByRole('button', { name: 'Computer Security Laboratory' })
          .click();
        await secondRoundCslFirstChoicePage
          .getByRole('button', { name: 'Networks and Distributed Systems Laboratory' })
          .click();

        await secondRoundCslFirstChoicePage.getByLabel('Photo Consent').selectOption('none');
        secondRoundCslFirstChoicePage.on('dialog', dialog => dialog.accept());
        const responsePromise = secondRoundCslFirstChoicePage.waitForResponse(
          '/dashboard/student/?/submit',
        );
        await secondRoundCslFirstChoicePage
          .getByRole('button', { name: 'Submit Lab Preferences' })
          .click();
        const response = await responsePromise;
        const responseData = await response.json();
        expect(responseData.type).toBe('success');
      });
    });

    test.describe('SecondSclSecondChoice (NDSL > SCL)', () => {
      test('completes profile', async ({ secondRoundSclSecondChoicePage }) => {
        await secondRoundSclSecondChoicePage.goto('/dashboard/student/');
        await secondRoundSclSecondChoicePage.getByLabel('Student Number').fill('202112362');
        const profileResponsePromise =
          secondRoundSclSecondChoicePage.waitForResponse('/dashboard/?/profile');
        await secondRoundSclSecondChoicePage
          .getByRole('button', { name: 'Complete Profile' })
          .click();
        const profileResponse = await profileResponsePromise;
        const profileResponseData = await profileResponse.json();
        expect(profileResponseData.type).toBe('success');
      });

      test('submits rankings', async ({ secondRoundSclSecondChoicePage }) => {
        await secondRoundSclSecondChoicePage.goto('/dashboard/student/');
        await secondRoundSclSecondChoicePage
          .getByRole('button', { name: 'Networks and Distributed Systems Laboratory' })
          .click();
        await secondRoundSclSecondChoicePage
          .getByRole('button', { name: 'Scientific Computing Laboratory' })
          .click();

        await secondRoundSclSecondChoicePage.getByLabel('Photo Consent').selectOption('google');
        secondRoundSclSecondChoicePage.on('dialog', dialog => dialog.accept());
        const responsePromise = secondRoundSclSecondChoicePage.waitForResponse(
          '/dashboard/student/?/submit',
        );
        await secondRoundSclSecondChoicePage
          .getByRole('button', { name: 'Submit Lab Preferences' })
          .click();
        const response = await responsePromise;
        const responseData = await response.json();
        expect(responseData.type).toBe('success');
      });
    });
  });

  test.describe('Second Draft — History During Registration', () => {
    test('history shows Draft #2 in registration phase', async ({ page }) => {
      await page.goto('/history/');
      await expect(page.getByText('Draft #2')).toBeVisible();
      await expect(page.getByText('currently waiting for students to register')).toBeVisible();
    });

    test('Draft #2 detail shows registration status', async ({ page }) => {
      await page.goto('/history/2/');
      await expect(page.getByText('registration stage')).toBeVisible();
    });
  });

  test.describe('Second Draft — Regular Flow (No Lottery Assignments)', () => {
    test('updates Draft #2 initial snapshots before start', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/2/');
      await expect(adminPage.getByText('There are currently')).toBeVisible();
      await expect(adminPage.getByText(/\b3\b/u).first()).toBeVisible();

      const editor = adminPage.locator('#draft-quota-editor-initial');
      await expect(editor).toBeVisible();

      await editor.locator('input[name="ndsl"]').fill('1');
      await editor.locator('input[name="csl"]').fill('1');
      await editor.locator('input[name="scl"]').fill('1');
      await editor.locator('input[name="cvmil"]').fill('0');

      const responsePromise = adminPage.waitForResponse('/dashboard/drafts/2/?/quota');
      await editor.getByRole('button', { name: 'Update Initial Snapshots' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('starts Draft #2', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/2/');
      await expect(adminPage.getByText('There are currently')).toBeVisible();
      await expect(adminPage.getByText(/\b3\b/u).first()).toBeVisible();

      adminPage.on('dialog', dialog => dialog.accept());
      const responsePromise = adminPage.waitForResponse('/dashboard/drafts/2/?/start');
      await adminPage.getByRole('button', { name: 'Start Draft' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');

      await expect(adminPage.getByText(/Round 1/u).first()).toBeVisible();
    });

    test('Draft #2 round-1 auto-acks show correct callouts', async ({
      sclHeadPage,
      cvmilHeadPage,
    }) => {
      await expectStudentsCallout(
        sclHeadPage,
        'No undrafted students have selected this lab in this round.',
        ['This lab has no more draft slots remaining for the rest of this draft.'],
      );
      await expectStudentsCallout(
        cvmilHeadPage,
        'This lab has no more draft slots remaining for the rest of this draft.',
      );
    });

    test('ACL head sees lab-not-in-draft message', async ({ aclHeadPage }) => {
      await aclHeadPage.goto('/dashboard/students');
      await expect(aclHeadPage.getByText('Lab Excluded from This Draft')).toBeVisible();
    });

    test('archives CSL while Draft #2 is active', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/labs/');

      const cslRow = adminPage
        .locator('tbody tr')
        .filter({ hasText: 'Computer Security Laboratory' });
      await expect(cslRow).toBeVisible();

      const responsePromise = adminPage.waitForResponse('/dashboard/labs/?/archive');
      await cslRow.getByRole('button').click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('student summary still shows archived ranked lab while draft is active', async ({
      secondRoundCslFirstChoicePage,
    }) => {
      await secondRoundCslFirstChoicePage.goto('/dashboard/student/');
      await expect(
        secondRoundCslFirstChoicePage.getByText('Your Lab Preferences', { exact: true }),
      ).toBeVisible();
      await expect(
        secondRoundCslFirstChoicePage.getByText('Computer Security Laboratory'),
      ).toBeVisible();
    });

    test('Round 1: NDSL selects SecondNdsl', async ({ ndslHeadPage }) => {
      await ndslHeadPage.goto('/dashboard/students/');
      await expect(ndslHeadPage.getByRole('button', { name: /SecondNdsl/u })).toBeVisible();
      await expect(ndslHeadPage.getByRole('button', { name: /SecondScl/u })).toBeVisible();

      await ndslHeadPage.getByRole('button', { name: /SecondNdsl/u }).click();
      ndslHeadPage.on('dialog', dialog => dialog.accept());
      const responsePromise = ndslHeadPage.waitForResponse('/dashboard/students/?/rankings');
      await ndslHeadPage.getByRole('button', { name: 'Submit Selection' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');

      await expectStudentsCallout(
        ndslHeadPage,
        'This lab has no more draft slots remaining for the rest of this draft.',
      );
      await expectPreviousPicksTab(ndslHeadPage, 1, [/SecondNdsl/u]);
    });

    test('Round 1: CSL selects SecondCsl', async ({ cslHeadPage }) => {
      await cslHeadPage.goto('/dashboard/students/');
      await expect(cslHeadPage.getByRole('button', { name: /SecondCsl/u })).toBeVisible();

      await cslHeadPage.getByRole('button', { name: /SecondCsl/u }).click();
      cslHeadPage.on('dialog', dialog => dialog.accept());
      const responsePromise = cslHeadPage.waitForResponse('/dashboard/students/?/rankings');
      await cslHeadPage.getByRole('button', { name: 'Submit Selection' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');

      await expectStudentsCallout(
        cslHeadPage,
        'This lab has no more draft slots remaining for the rest of this draft.',
      );
    });

    test('Draft #2 reaches Round 2', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/2/');
      await expect(adminPage.getByText(/Round 2/u).first()).toBeVisible();
    });

    test('Draft #2 round-2 auto-acks show correct callouts', async ({
      cvmilHeadPage,
      ndslHeadPage,
      cslHeadPage,
    }) => {
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

    test('Round 2: SCL selects SecondScl', async ({ sclHeadPage }) => {
      await sclHeadPage.goto('/dashboard/students/');
      await expect(sclHeadPage.getByRole('button', { name: /SecondScl/u })).toBeVisible();

      await sclHeadPage.getByRole('button', { name: /SecondScl/u }).click();
      sclHeadPage.on('dialog', dialog => dialog.accept());
      const responsePromise = sclHeadPage.waitForResponse('/dashboard/students/?/rankings');
      await sclHeadPage.getByRole('button', { name: 'Submit Selection' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');

      await expectStudentsCallout(
        sclHeadPage,
        'The draft is now in the lottery stage. Kindly contact the draft administrators on how to proceed.',
      );
    });

    test('lottery stage shows zero eligible students', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/2/');
      await expect(adminPage.getByRole('heading', { name: 'Interventions Phase' })).toBeVisible();
      await expectVisibleButtons(adminPage, ['Eligible for Lottery']);
      await adminPage.getByRole('button', { name: 'Eligible for Lottery' }).first().click();
      await expect(
        adminPage.getByText('Congratulations! All participants have been drafted.'),
      ).toBeVisible();
    });

    test('rejects interventions for unsnapshotted labs', async ({ adminPage }) => {
      const status = await adminPage.evaluate(async () => {
        const data = new FormData();
        data.set('draft', '2');
        data.set('00000000000000000000000000', 'acl');
        const response = await fetch('/dashboard/drafts/2/?/intervene', {
          method: 'POST',
          body: data,
        });
        return response.status;
      });
      expect(status).toBe(400);
    });
  });

  test.describe('Second Draft — Lottery And Finalization', () => {
    test('sets lottery snapshots to zero for Draft #2', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/2/');
      await adminPage.getByRole('button', { name: 'Eligible for Lottery' }).first().click();
      const editor = adminPage.locator('#draft-quota-editor-lottery');
      await expect(editor).toBeVisible();

      await editor.locator('input[name="ndsl"]').fill('0');
      await editor.locator('input[name="csl"]').fill('0');
      await editor.locator('input[name="scl"]').fill('0');
      await editor.locator('input[name="cvmil"]').fill('0');

      {
        const quotaResponsePromise = adminPage.waitForResponse('/dashboard/drafts/2/?/quota');
        await editor.getByRole('button', { name: 'Update Lottery Snapshots' }).click();
        const quotaResponse = await quotaResponsePromise;
        const quotaResponseData = await quotaResponse.json();
        expect(quotaResponseData.type).toBe('success');
      }
    });

    test('runs lottery for Draft #2', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/2/');

      adminPage.on('dialog', dialog => dialog.accept());
      const concludeResponsePromise = adminPage.waitForResponse('/dashboard/drafts/2/?/conclude');
      await adminPage.getByRole('button', { name: 'Run Lottery' }).click();

      const concludeResponse = await concludeResponsePromise;
      const concludeResponseData = await concludeResponse.json();
      expect(concludeResponseData.type).toBe('success');
    });

    test('enters review phase with finalize action for Draft #2', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/2/');
      await expect(adminPage.getByText(/Started .* · Review/u)).toBeVisible();
      await expect(adminPage.getByRole('heading', { name: 'Review Phase' })).toHaveCount(0);
      await expect(adminPage.getByRole('heading', { name: 'Lottery Phase' })).toHaveCount(0);
      await expect(adminPage.getByRole('button', { name: 'Finalize Draft' })).toBeVisible();
    });

    test('finalizes Draft #2', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/2/');
      adminPage.on('dialog', dialog => dialog.accept());

      const finalizeResponsePromise = adminPage.waitForResponse('/dashboard/drafts/2/?/finalize');
      await adminPage.getByRole('button', { name: 'Finalize Draft' }).click();
      const finalizeResponse = await finalizeResponsePromise;
      const finalizeResponseData = await finalizeResponse.json();
      expect(finalizeResponseData.type).toBe('success');
    });
  });

  test.describe('Second Draft — Dashboard And History Verification', () => {
    test('admin finalized breakdown is correct for Draft #2', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/2/');

      await expect(adminPage.locator('#stat-total-students')).toHaveText('3');
      await expect(adminPage.locator('#stat-participating-labs')).toHaveText('4');

      await adminPage.getByRole('button', { name: 'See Results' }).click();
      await adminPage.waitForLoadState('networkidle');

      await expect(adminPage.locator('#section-regular-drafted')).toContainText(
        'Regular Drafted (3)',
      );
      await expect(adminPage.locator('#section-intervention-drafted')).toContainText(
        'Intervention Drafted (0)',
      );
      await expect(adminPage.locator('#section-lottery-drafted')).toContainText(
        'Lottery Drafted (0)',
      );
    });

    test.describe('drafts table and history', () => {
      test('drafts table lists Draft #2 and Draft #1', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/drafts/');
        await expect(adminPage.getByText('#2')).toBeVisible();
        await expect(adminPage.getByText('#1')).toBeVisible();
      });

      test('drafts table shows both drafts as finalized', async ({ adminPage }) => {
        await adminPage.goto('/dashboard/drafts/');
        await expect(adminPage.getByText('Finalized')).toHaveCount(2);
      });

      test('history index reflects Draft #2 2-round finalization', async ({ page }) => {
        await page.goto('/history/');
        await expect(page.getByText('Draft #2')).toBeVisible();
        await expect(page.getByText(/over 2 rounds/u)).toBeVisible();
      });

      test('Draft #2 detail shows finalized status', async ({ page }) => {
        await page.goto('/history/2/');
        await expect(page.getByText(/was held from/u)).toBeVisible();
        await expect(page.getByText(/over 2 rounds/u)).toBeVisible();
      });

      test('Draft #2 detail timeline has round ordering without lottery events', async ({
        page,
      }) => {
        await page.goto('/history/2/');

        const items = page.locator('section > ol.border-s > li.ms-6 ol.space-y-1 > li');
        const textContents = await items.allTextContents();
        const texts = textContents.map(text => text.replaceAll(/\s+/gu, ' ').trim());

        function idx(regex: RegExp) {
          return texts.findIndex(t => regex.test(t));
        }

        const anyRound2Batch = idx(/2nd batch/iu);
        const anyRound1Batch = idx(/1st batch/iu);

        expect(idx(/was finalized/u)).toBe(0);
        expect(idx(/was created/u)).toBe(texts.length - 1);
        expect(anyRound2Batch).toBeGreaterThanOrEqual(0);
        expect(anyRound1Batch).toBeGreaterThanOrEqual(0);
        expect(anyRound2Batch).toBeLessThan(anyRound1Batch);

        // Second draft had no randomized lottery assignments.
        expect(idx(/obtained a batch.*lottery/isu)).toBe(-1);
      });
    });
  });

  test.describe('Second Draft — Archived Lab Read Models', () => {
    test('CSL appears in archived labs after Draft #2 finalization', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/labs/');
      await adminPage.getByRole('tab', { name: /Archived Labs/u }).click();
      await expect(adminPage.getByText('Computer Security Laboratory')).toBeVisible();
    });

    test('students.csv keeps ranked archived labs', async ({ adminPage }) => {
      const response = await adminPage.request.get('/dashboard/drafts/2/students.csv/');
      expect(response.status()).toBe(200);

      const csv = await response.text();
      const secondCslRow = csv
        .split('\n')
        .find(line => line.includes('second-csl-first-choice.student@up.edu.ph'));
      expect(secondCslRow).toBeTruthy();
      expect(secondCslRow ?? '').toContain('csl');
    });
  });

  test.describe('Second Draft — Student And Faculty Final States', () => {
    test('SecondNdslFirstChoice sees NDSL assignment', async ({
      secondRoundNdslFirstChoicePage,
    }) => {
      await secondRoundNdslFirstChoicePage.goto('/dashboard/student/');
      await expect(
        secondRoundNdslFirstChoicePage.getByText(/Networks and Distributed Systems Laboratory/u),
      ).toBeVisible();
    });

    test('SecondCslFirstChoice sees CSL assignment', async ({ secondRoundCslFirstChoicePage }) => {
      await secondRoundCslFirstChoicePage.goto('/dashboard/student/');
      await expect(
        secondRoundCslFirstChoicePage.getByText(/Computer Security Laboratory/u),
      ).toBeVisible();
    });

    test('SecondSclSecondChoice sees SCL assignment', async ({
      secondRoundSclSecondChoicePage,
    }) => {
      await secondRoundSclSecondChoicePage.goto('/dashboard/student/');
      await expect(
        secondRoundSclSecondChoicePage.getByText(/Scientific Computing Laboratory/u),
      ).toBeVisible();
    });

    test.describe('Draft #2 faculty views', () => {
      test('NDSL head can view assignees', async ({ ndslHeadPage }) => {
        await ndslHeadPage.goto('/dashboard/lab/');
        await ndslHeadPage.getByRole('button', { name: /Draft 2/u }).click();
        await expect(ndslHeadPage.getByText(/SecondNdsl/u)).toBeVisible();
      });

      test('CSL head can view assignees', async ({ cslHeadPage }) => {
        await cslHeadPage.goto('/dashboard/lab/');
        await cslHeadPage.getByRole('button', { name: /Draft 2/u }).click();
        await expect(cslHeadPage.getByText(/SecondCsl/u)).toBeVisible();
      });

      test('SCL head can view assignees', async ({ sclHeadPage }) => {
        await sclHeadPage.goto('/dashboard/lab/');
        await sclHeadPage.getByRole('button', { name: /Draft 2/u }).click();
        await expect(sclHeadPage.getByText(/SecondScl/u)).toBeVisible();
      });
    });
  });

  test.describe('Third Draft', () => {
    test.describe.configure({ mode: 'serial' });

    let thirdDraftId = '3';

    function draftDetailPath() {
      return `/dashboard/drafts/${thirdDraftId}/`;
    }

    test.describe('Closed Registration', () => {
      test.describe('Allowlist', () => {
        test('creates Draft #3 with a past registration close', async ({ adminPage }) => {
          await adminPage.goto('/dashboard/drafts/');
          await adminPage.getByRole('button', { name: 'Create Draft' }).click();

          const dialog = adminPage.getByRole('dialog');
          await expect(dialog).toBeVisible();

          const formattedDate = subDays(new Date(), 1).toISOString().slice(0, 16);

          await dialog.locator('input#closesAt').fill(formattedDate);
          await dialog.locator('input#rounds').fill('1');

          adminPage.on('dialog', async dialog => await dialog.accept());
          const createResponsePromise = adminPage.waitForResponse('/dashboard/drafts/?/init');
          await dialog.getByRole('button', { name: 'Create Draft' }).click();

          const createResponse = await createResponsePromise;
          const createResponseData = await createResponse.json();
          expect(createResponseData.type).toBe('success');

          await adminPage.goto(draftDetailPath());
          await expect(adminPage.getByRole('button', { name: 'Manage Allowlist' })).toBeVisible();
        });

        test('shows the allowlist entry point on the draft detail page', async ({ adminPage }) => {
          await adminPage.goto(draftDetailPath());
          await expect(adminPage.getByRole('button', { name: 'Manage Allowlist' })).toBeVisible();
          await expect(
            adminPage.getByText('No students are currently on the allowlist.'),
          ).toBeVisible();
        });

        test('lazy-loads the allowlist dialog on open', async ({ adminPage }) => {
          await adminPage.goto(draftDetailPath());

          const allowlistResponsePromise = adminPage.waitForResponse(
            `/dashboard/drafts/${thirdDraftId}/allowlist`,
          );
          await adminPage.getByRole('button', { name: 'Manage Allowlist' }).click();
          const allowlistResponse = await allowlistResponsePromise;
          expect(allowlistResponse.ok()).toBeTruthy();

          const allowlistDialog = adminPage.getByRole('dialog');
          await expect(allowlistDialog).toBeVisible();
          await expect(allowlistDialog.getByText('No students on the allowlist')).toBeVisible();
        });

        test('adds a late registrant to the allowlist', async ({ adminPage }) => {
          await adminPage.goto(draftDetailPath());

          const allowlistResponsePromise = adminPage.waitForResponse(
            `/dashboard/drafts/${thirdDraftId}/allowlist`,
          );
          await adminPage.getByRole('button', { name: 'Manage Allowlist' }).click();
          const allowlistResponse = await allowlistResponsePromise;
          expect(allowlistResponse.ok()).toBeTruthy();

          const allowlistDialog = adminPage.getByRole('dialog');
          await expect(allowlistDialog.getByText('No students on the allowlist')).toBeVisible();

          const addResponsePromise = adminPage.waitForResponse(
            `/dashboard/drafts/${thirdDraftId}/?/add-to-allowlist`,
          );
          const refetchAfterAddPromise = adminPage.waitForResponse(
            `/dashboard/drafts/${thirdDraftId}/allowlist`,
          );
          await allowlistDialog.getByLabel('Student Email').fill('late.student@up.edu.ph');
          await allowlistDialog.getByRole('button', { name: 'Add to Allowlist' }).click();

          const addResponse = await addResponsePromise;
          expect(addResponse.ok()).toBeTruthy();
          const addResponseData = await addResponse.json();
          expect(addResponseData.type).toBe('success');

          const refetchAfterAdd = await refetchAfterAddPromise;
          expect(refetchAfterAdd.ok()).toBeTruthy();
          await expect(allowlistDialog.getByText('late.student@up.edu.ph')).toBeVisible();
          await expect(
            adminPage.getByText('1 student is currently on the allowlist.'),
          ).toBeVisible();
        });

        test('removes a late registrant from the allowlist', async ({ adminPage }) => {
          await adminPage.goto(draftDetailPath());

          const allowlistResponsePromise = adminPage.waitForResponse(
            `/dashboard/drafts/${thirdDraftId}/allowlist`,
          );
          await adminPage.getByRole('button', { name: 'Manage Allowlist' }).click();
          const allowlistResponse = await allowlistResponsePromise;
          expect(allowlistResponse.ok()).toBeTruthy();

          const allowlistDialog = adminPage.getByRole('dialog');
          const allowlistRow = allowlistDialog
            .locator('tbody tr')
            .filter({ hasText: 'late.student@up.edu.ph' });
          await expect(allowlistRow).toBeVisible();

          const removeResponsePromise = adminPage.waitForResponse(
            `/dashboard/drafts/${thirdDraftId}/?/remove-from-allowlist`,
          );
          const refetchAfterRemovePromise = adminPage.waitForResponse(
            `/dashboard/drafts/${thirdDraftId}/allowlist`,
          );
          await allowlistRow.getByRole('button').click();

          const removeResponse = await removeResponsePromise;
          expect(removeResponse.ok()).toBeTruthy();

          const refetchAfterRemove = await refetchAfterRemovePromise;
          expect(refetchAfterRemove.ok()).toBeTruthy();
          await expect(allowlistDialog.getByText('No students on the allowlist')).toBeVisible();
          await expect(
            adminPage.getByText('No students are currently on the allowlist.'),
          ).toBeVisible();
        });
      });
    });
  });

  test.describe('Logout', () => {
    test('admin can log out and lands on home', async ({ adminPage }) =>
      await assertLogout(adminPage));
    test('NDSL head can log out and lands on home', async ({ ndslHeadPage }) =>
      await assertLogout(ndslHeadPage));
    test('CSL head can log out and lands on home', async ({ cslHeadPage }) =>
      await assertLogout(cslHeadPage));
    test('SCL head can log out and lands on home', async ({ sclHeadPage }) =>
      await assertLogout(sclHeadPage));
    test('CVMIL head can log out and lands on home', async ({ cvmilHeadPage }) =>
      await assertLogout(cvmilHeadPage));
    test('ACL head can log out and lands on home', async ({ aclHeadPage }) =>
      await assertLogout(aclHeadPage));
    test('Eager can log out and lands on home', async ({ eagerDrafteePage }) =>
      await assertLogout(eagerDrafteePage));
    test('Patient can log out and lands on home', async ({ patientCandidatePage }) =>
      await assertLogout(patientCandidatePage));
    test('Persistent can log out and lands on home', async ({ persistentHopefulPage }) =>
      await assertLogout(persistentHopefulPage));
    test('Unlucky can log out and lands on home', async ({ unluckyFullRankerPage }) =>
      await assertLogout(unluckyFullRankerPage));
    test('NoRank can log out and lands on home', async ({ noRankStudentPage }) =>
      await assertLogout(noRankStudentPage));
    test('Idle can log out and lands on home', async ({ idleBystanderPage }) =>
      await assertLogout(idleBystanderPage));
    test('Late can log out and lands on home', async ({ lateRegistrantPage }) =>
      await assertLogout(lateRegistrantPage));
    test('PartialToDrafted can log out and lands on home', async ({ partialToDraftedPage }) =>
      await assertLogout(partialToDraftedPage));
    test('PartialToLottery can log out and lands on home', async ({ partialToLotteryPage }) =>
      await assertLogout(partialToLotteryPage));
    test('SecondNdslFirstChoice can log out and lands on home', async ({
      secondRoundNdslFirstChoicePage,
    }) => await assertLogout(secondRoundNdslFirstChoicePage));
    test('SecondCslFirstChoice can log out and lands on home', async ({
      secondRoundCslFirstChoicePage,
    }) => await assertLogout(secondRoundCslFirstChoicePage));
    test('SecondSclSecondChoice can log out and lands on home', async ({
      secondRoundSclSecondChoicePage,
    }) => await assertLogout(secondRoundSclSecondChoicePage));
    test('SnapshotGuard can log out and lands on home', async ({ snapshotGuardStudentPage }) =>
      await assertLogout(snapshotGuardStudentPage));
  });
});
