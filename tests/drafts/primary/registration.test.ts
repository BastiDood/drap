import { CUSTOM_AVATAR_TOO_LARGE_MESSAGE } from '$lib/features/student/registration-open/constants';
import { createDraft, startDraft, updateInitialQuota } from '$tests/actions/draft';
import { expectStudentsCallout, expectVisibleButtons } from '$tests/actions/faculty';
import { getDraftRow, getHistoryDraft, draftYearPattern } from '$tests/actions/history';
import { expectNoRequests } from '$tests/actions/network';
import { submitLabPreferences } from '$tests/actions/student';
import { test } from '$tests/fixtures/users';
import { expect } from '@playwright/test';
import { addDays } from 'date-fns';
const CUSTOM_AVATAR_TEST_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64',
);
test(
  'Create a draft with three regular rounds',
  { tag: '@full-lifecycle-create' },
  async ({ adminPage }) => {
    await test.step('creates a new draft with 3 rounds', async () => {
      await createDraft(adminPage, { closesAt: addDays(new Date(), 1), rounds: 3 });
      await expect(adminPage.getByRole('dialog')).not.toBeVisible();
      await expect(getDraftRow(adminPage, '1').locator('td').first()).toHaveText(/\d{4}/u);
      await expect(adminPage.getByText('Registration')).toBeVisible();
    });
  },
);
test(
  'Faculty can navigate during registration',
  { tag: '@full-lifecycle-registration-guards' },
  async ({ ndslHeadPage }) => {
    await test.step('faculty can access lab page', async () => {
      await ndslHeadPage.goto('/dashboard/lab/');
      await expect(
        ndslHeadPage.getByText('Networks and Distributed Systems Laboratory'),
      ).toBeVisible();
    });
    await test.step('faculty sees no students yet', async () => {
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
  },
);
test(
  'The lab catalog blocks changes during registration',
  { tag: '@full-lifecycle-registration-guards' },
  async ({ adminPage }) => {
    await test.step('labs page shows destructive callout during registration', async () => {
      await adminPage.goto('/dashboard/labs/');
      await expect(adminPage.getByText(/registration is ongoing/iu)).toBeVisible();
      await expect(adminPage.getByText('Changes on this page')).not.toBeVisible();
    });
    await test.step('Archived Labs tab remains accessible during registration', async () => {
      await adminPage.goto('/dashboard/labs/');
      const archivedTab = adminPage.getByRole('tab', { name: /Archived Labs/u });
      await expect(archivedTab).toBeEnabled();
      await archivedTab.click();
      await expect(adminPage.getByRole('tabpanel')).toContainText('No archived labs found.');
    });
    await test.step('Create Lab button is disabled', async () => {
      await adminPage.goto('/dashboard/labs/');
      await expect(adminPage.getByRole('button', { name: 'Create Lab' })).toBeDisabled();
    });
    await test.step('Archive buttons are disabled', async () => {
      await adminPage.goto('/dashboard/labs/');
      const ndslRow = adminPage
        .locator('tbody tr')
        .filter({ hasText: 'Networks and Distributed Systems Laboratory' });
      await expect(ndslRow.getByRole('button')).toBeDisabled();
    });
    await test.step('server rejects lab creation (403)', async () => {
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
    await test.step('server rejects lab creation when draft id is omitted during an active draft (403)', async () => {
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
    await test.step('server rejects lab creation when draft id is invalid (400)', async () => {
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
    await test.step('server rejects lab archival (403)', async () => {
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
    await test.step('server rejects lab restoration (403)', async () => {
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
  },
);
test(
  'Public history shows the registration state',
  { tag: '@full-lifecycle-registration-guards' },
  async ({ page }) => {
    await test.step('shows draft year in registration phase', async () => {
      await page.goto('/history/');
      await expect(getHistoryDraft(page, '1')).toContainText(draftYearPattern);
      await expect(page.getByText('currently waiting for students to register')).toBeVisible();
    });
    await test.step('shows registration status', async () => {
      await page.goto('/history/1/');
      await expect(page.getByText('registration stage')).toBeVisible();
    });
    await test.step('shows creation event in timeline', async () => {
      await page.goto('/history/1/');
      const items = page.locator('section > ol.border-s > li.ms-6 ol.space-y-1 > li');
      await expect(items).toHaveCount(1);
      await expect(items.first()).toContainText(/Draft \d{4} was created\./u);
    });
  },
);
test(
  'Eager registers and receives a photo-sharing receipt',
  { tag: '@full-lifecycle-register-students' },
  async ({ eagerDrafteePage }) => {
    await test.step('Eager submits full preferences (NDSL > CSL > SCL)', async () => {
      await submitLabPreferences(eagerDrafteePage, {
        labs: [
          'Networks and Distributed Systems Laboratory',
          'Computer Security Laboratory',
          'Scientific Computing Laboratory',
        ],
        photoConsent: 'google',
      });
    });
    await test.step('Eager sees photo-share receipt copy after reload', async () => {
      await eagerDrafteePage.goto('/dashboard/student/');
      await expect(
        eagerDrafteePage.getByText('Faculty will see this photo during review.'),
      ).toBeVisible();
    });
  },
);
test(
  'Patient registers without a photo and receives a receipt',
  { tag: '@full-lifecycle-register-students' },
  async ({ patientCandidatePage }) => {
    await test.step('Patient submits full preferences (CSL > NDSL > SCL)', async () => {
      await submitLabPreferences(patientCandidatePage, {
        labs: [
          'Computer Security Laboratory',
          'Networks and Distributed Systems Laboratory',
          'Scientific Computing Laboratory',
        ],
        photoConsent: 'none',
      });
    });
    await test.step('Patient sees opt-out receipt copy after reload', async () => {
      await patientCandidatePage.goto('/dashboard/student/');
      await expect(
        patientCandidatePage.getByText(
          'You chose not to share a photo; faculty will see only your name and student number.',
        ),
      ).toBeVisible();
    });
  },
);
test(
  'Persistent registers three preferences',
  { tag: '@full-lifecycle-register-students' },
  async ({ persistentHopefulPage }) => {
    await test.step('Persistent submits full preferences (SCL > CVMIL > ACL)', async () => {
      await submitLabPreferences(persistentHopefulPage, {
        labs: [
          'Scientific Computing Laboratory',
          'Computer Vision and Machine Intelligence Laboratory',
          'Algorithms and Complexity Laboratory',
        ],
        photoConsent: 'none',
      });
    });
  },
);
test(
  'Unlucky registers three preferences',
  { tag: '@full-lifecycle-register-students' },
  async ({ unluckyFullRankerPage }) => {
    await test.step('Unlucky submits full preferences (ACL > CVMIL > NDSL)', async () => {
      await submitLabPreferences(unluckyFullRankerPage, {
        labs: [
          'Algorithms and Complexity Laboratory',
          'Computer Vision and Machine Intelligence Laboratory',
          'Networks and Distributed Systems Laboratory',
        ],
        photoConsent: 'google',
      });
    });
  },
);
test(
  'PartialToDrafted registers two preferences',
  { tag: '@full-lifecycle-register-students' },
  async ({ partialToDraftedPage }) => {
    await test.step('PartialToDrafted submits 2 preferences (NDSL > CSL)', async () => {
      await submitLabPreferences(partialToDraftedPage, {
        labs: ['Networks and Distributed Systems Laboratory', 'Computer Security Laboratory'],
        photoConsent: 'google',
      });
    });
  },
);
test(
  'PartialToLottery registers one preference',
  { tag: '@full-lifecycle-register-students' },
  async ({ partialToLotteryPage }) => {
    await test.step('PartialToLottery submits 1 preference (ACL)', async () => {
      await submitLabPreferences(partialToLotteryPage, {
        labs: ['Algorithms and Complexity Laboratory'],
        photoConsent: 'none',
      });
    });
  },
);
test(
  'NoRank registers without preferences',
  { tag: '@full-lifecycle-register-students' },
  async ({ noRankStudentPage }) => {
    await test.step('NoRank submits 0 prefs (goes directly to lottery)', async () => {
      await submitLabPreferences(noRankStudentPage, { labs: [], photoConsent: 'none' });
    });
    await test.step('NoRank sees submitted state after reload', async () => {
      await noRankStudentPage.goto('/dashboard/student/');
      await expect(noRankStudentPage.getByText('Registration Complete')).toBeVisible();
      await expect(noRankStudentPage.getByText('No Labs Selected')).toBeVisible();
    });
  },
);
test(
  'Idle corrects an oversized photo and registers a custom photo',
  { tag: '@full-lifecycle-register-students' },
  async ({ idleBystanderPage }) => {
    await test.step('Idle gets a validation failure for an oversized custom photo', async () => {
      await idleBystanderPage.goto('/dashboard/student/');
      await idleBystanderPage.getByLabel('Photo Consent').selectOption('custom');
      await idleBystanderPage.getByLabel('Custom Image').setInputFiles({
        name: 'avatar.png',
        mimeType: 'image/png',
        buffer: Buffer.alloc(4 * 1024 * 1024 + 1),
      });
      await expectNoRequests(idleBystanderPage, '/dashboard/student/', async () => {
        await idleBystanderPage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
        await expect(idleBystanderPage.getByText(CUSTOM_AVATAR_TOO_LARGE_MESSAGE)).toBeVisible();
      });
    });
    await test.step('Idle submits 0 prefs with a custom photo (goes directly to lottery)', async () => {
      await submitLabPreferences(idleBystanderPage, {
        customImage: {
          buffer: CUSTOM_AVATAR_TEST_PNG,
          mimeType: 'image/png',
          name: 'avatar.png',
        },
        labs: [],
        photoConsent: 'custom',
      });
    });
  },
);
test(
  'Inspect registration, configure quotas, and start the draft',
  { tag: '@full-lifecycle-start' },
  async ({ adminPage }) => {
    await test.step('Administrators can open the registered-student sheet', async () => {
      await test.step('navigates to draft detail page', async () => {
        await adminPage.goto('/dashboard/drafts/');
        await adminPage.getByRole('link', { name: 'View' }).first().click();
        await expect(adminPage).toHaveURL(/\/dashboard\/drafts\/1\//u);
      });
      await test.step('sees registrant list', async () => {
        await adminPage.goto('/dashboard/drafts/1/');
        await expect(adminPage.getByText('Registered Students', { exact: true })).toBeVisible();
        await expect(adminPage.getByText('Current Draft Participants')).toBeVisible();
        await expect(adminPage.getByText(/\b8\b/u).first()).toBeVisible();
        await expectVisibleButtons(adminPage, ['See Registered Students']);
      });
      await test.step('registered draftees do not fetch before the sheet opens', async () => {
        await expectNoRequests(adminPage, '/dashboard/drafts/1/draftees', async () => {
          await adminPage.goto('/dashboard/drafts/1/');
          await expectVisibleButtons(adminPage, ['See Registered Students']);
        });
      });
      await test.step('registered draftees fetch when the sheet opens', async () => {
        await adminPage.goto('/dashboard/drafts/1/');
        await expectVisibleButtons(adminPage, ['See Registered Students']);
        const responsePromise = adminPage.waitForResponse(
          response => new URL(response.url()).pathname === '/dashboard/drafts/1/draftees',
        );
        await adminPage.getByRole('button', { name: 'See Registered Students' }).click();
        await responsePromise;
      });
    });
    await test.step('Configure quotas and start the draft', async () => {
      await test.step('shows initial snapshot quotas as placeholders', async () => {
        await adminPage.goto('/dashboard/drafts/1/');
        await adminPage.getByRole('button', { name: 'Setup Quota' }).click();
        const editor = adminPage.locator('#draft-quota-editor-initial');
        await expect(editor).toBeVisible();
        const aclInput = editor.locator('input[name="acl"]');
        await expect(aclInput).toHaveValue('');
        await expect(aclInput).toHaveAttribute('placeholder', '0');
        const ndslInput = editor.locator('input[name="ndsl"]');
        await expect(ndslInput).toHaveValue('');
        await expect(ndslInput).toHaveAttribute('placeholder', '0');
      });
      await test.step('updates initial snapshots', async () => {
        await updateInitialQuota(adminPage, '1', {
          acl: 1,
          csl: 2,
          cvmil: 1,
          ndsl: 2,
          scl: 2,
        });
      });
      await test.step('shows committed placeholders after update', async () => {
        await adminPage.goto('/dashboard/drafts/1/');

        const quotaButton = adminPage.getByRole('button', { name: 'Edit Quota' });
        await expect(quotaButton).toBeVisible();
        await quotaButton.click();
        const editor = adminPage.locator('#draft-quota-editor-initial');
        await expect(editor).toBeVisible();
        const aclInput = editor.locator('input[name="acl"]');
        await expect(aclInput).toHaveValue('');
        await expect(aclInput).toHaveAttribute('placeholder', '1');
        const ndslInput = editor.locator('input[name="ndsl"]');
        await expect(ndslInput).toHaveValue('');
        await expect(ndslInput).toHaveAttribute('placeholder', '2');
      });
      await test.step('starts the draft', async () => {
        await startDraft(adminPage, '1');
        await expect(adminPage.getByText(/Round 1/u).first()).toBeVisible();
      });
    });
  },
);

test(
  'Registration records support search, sorting and filtering',
  { tag: '@full-lifecycle-round-1-observe' },
  async ({ adminPage }) => {
    await test.step('searches registered students by name and email', async () => {
      await adminPage.goto('/dashboard/drafts/1/');
      await adminPage.getByRole('button', { name: /^Registration /u }).click();
      await adminPage.getByRole('button', { name: 'View All Draftees' }).click();
      const sheet = adminPage.locator('[data-slot="sheet-content"]').last();
      const search = sheet.getByPlaceholder('Search students...');
      const studentNumbers = sheet.getByRole('cell', { name: /^2020\d{5}$/u });
      await expect(studentNumbers).toHaveCount(8);
      await search.fill('patient');
      await expect(studentNumbers).toHaveText(['202012346']);
      await search.fill('eager.student@up.edu.ph');
      await expect(studentNumbers).toHaveText(['202012345']);
      await search.clear();
      await expect(studentNumbers).toHaveCount(8);
    });
    await test.step('sorts registered students through the student-number header', async () => {
      await adminPage.goto('/dashboard/drafts/1/');
      await adminPage.getByRole('button', { name: /^Registration /u }).click();
      await adminPage.getByRole('button', { name: 'View All Draftees' }).click();
      const sheet = adminPage.locator('[data-slot="sheet-content"]').last();
      const studentNumbers = sheet.getByRole('cell', { name: /^2020\d{5}$/u });
      const sort = sheet.getByRole('button', { name: 'Student Number', exact: true });
      await expect(studentNumbers).toHaveCount(8);
      await sort.click();
      await expect(studentNumbers.first()).toHaveText('202012353');
      await expect(studentNumbers.last()).toHaveText('202012345');
      await sort.click();
      await expect(studentNumbers).toHaveText([
        '202012345',
        '202012346',
        '202012347',
        '202012348',
        '202012349',
        '202012350',
        '202012351',
        '202012353',
      ]);
    });
    await test.step('filters registered students by a preferred lab and clears the filter', async () => {
      await adminPage.goto('/dashboard/drafts/1/');
      await adminPage.getByRole('button', { name: /^Registration /u }).click();
      await adminPage.getByRole('button', { name: 'View All Draftees' }).click();
      const sheet = adminPage.locator('[data-slot="sheet-content"]').last();
      const studentNumbers = sheet.getByRole('cell', { name: /^2020\d{5}$/u });
      const preferences = sheet.getByRole('button', {
        name: 'Lab Preferences',
        exact: true,
        expanded: false,
      });
      await expect(studentNumbers).toHaveCount(8);
      await preferences.click();
      await adminPage.getByRole('menuitemcheckbox', { name: /ndsl\s+4/iu }).click();
      await expect(studentNumbers).toHaveCount(4);
      await expect(sheet.getByRole('cell', { name: '202012345', exact: true })).toBeVisible();
      await expect(sheet.getByRole('cell', { name: '202012348', exact: true })).toBeVisible();
      await expect(adminPage.getByRole('menu')).toBeHidden();
      await preferences.click();
      await adminPage.getByRole('menuitem', { name: 'Clear Filters', exact: true }).click();
      await expect(studentNumbers).toHaveCount(8);
    });
    await test.step('late-only filtering excludes on-time registrations without showing the hidden column', async () => {
      await adminPage.goto('/dashboard/drafts/1/');
      await adminPage.getByRole('button', { name: /^Registration /u }).click();
      await adminPage.getByRole('button', { name: 'View All Draftees' }).click();
      const sheet = adminPage.locator('[data-slot="sheet-content"]').last();
      const studentNumbers = sheet.getByRole('cell', { name: /^2020\d{5}$/u });
      const lateOnly = sheet.getByRole('button', { name: 'Late Only', exact: true });
      await expect(studentNumbers).toHaveCount(8);
      await expect(sheet.getByRole('columnheader', { name: 'Late', exact: true })).toHaveCount(0);
      await lateOnly.click();
      await expect(studentNumbers).toHaveCount(0);
      await expect(sheet.locator('tbody td')).toHaveAttribute('colspan', '6');
      await lateOnly.click();
      await expect(studentNumbers).toHaveCount(8);
    });
  },
);
test(
  'Late registration is closed',
  { tag: '@full-lifecycle-round-1-observe' },
  async ({ lateRegistrantPage }) => {
    await test.step('sees registration closed message', async () => {
      await lateRegistrantPage.goto('/dashboard/student/');
      await expect(lateRegistrantPage.getByText('Registration Closed')).toBeVisible();
    });
  },
);
test(
  'Catalog controls are available after registration',
  { tag: '@full-lifecycle-round-1-observe' },
  async ({ adminPage }) => {
    await test.step('Create Lab button is enabled after registration ends', async () => {
      await adminPage.goto('/dashboard/labs/');
      await expect(adminPage.getByRole('button', { name: 'Create Lab' })).toBeEnabled();
      await expect(adminPage.getByText('Changes on this page')).toBeVisible();
    });
    await test.step('Archive buttons are enabled after registration ends', async () => {
      await adminPage.goto('/dashboard/labs/');
      const ndslRow = adminPage
        .locator('tbody tr')
        .filter({ hasText: 'Networks and Distributed Systems Laboratory' });
      await expect(ndslRow.getByRole('button')).toBeEnabled();
    });
  },
);
test(
  'Students see their submitted preferences during the draft',
  { tag: '@full-lifecycle-round-1-observe' },
  async ({ noRankStudentPage, eagerDrafteePage }) => {
    await test.step('NoRank sees draft progress with empty submission', async () => {
      await noRankStudentPage.goto('/dashboard/student/');
      await expect(noRankStudentPage.getByText('The draft is in progress.')).toBeVisible();
      await expect(noRankStudentPage.getByText('No Labs Selected')).toBeVisible();
    });
    await test.step('Eager sees draft progress with lab preferences', async () => {
      await eagerDrafteePage.goto('/dashboard/student/');
      await expect(eagerDrafteePage.getByText('The draft is in progress.')).toBeVisible();
      await expect(eagerDrafteePage.getByText('Your Lab Preferences')).toBeVisible();
    });
  },
);
