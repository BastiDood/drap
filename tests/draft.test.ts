import { expect, type Page } from '@playwright/test';

import { test } from './fixtures/users';

async function assertLogout(page: Page) {
  await page.goto('/dashboard/');
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('heading', { name: 'Draft Ranking Automated Processor' }),
  ).toBeVisible();
}

test.describe('Draft Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  test.describe('Initial State', () => {
    test('history page shows no drafts', async ({ page, database: _database }) => {
      await page.goto('/history/');
      await expect(page.getByText('No drafts have been recorded yet')).toBeVisible();
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

    test('sets quota for each lab', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/labs/');
      await adminPage.locator('input[name="ndsl"]').fill('2');
      await adminPage.locator('input[name="csl"]').fill('2');
      await adminPage.locator('input[name="scl"]').fill('2');
      await adminPage.locator('input[name="cvmil"]').fill('1');
      await adminPage.locator('input[name="acl"]').fill('1');
      const responsePromise = adminPage.waitForResponse('/dashboard/labs/?/quota');
      await adminPage.getByRole('button', { name: 'Update Quotas' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });
  });

  test.describe('Admin Draft Creation', () => {
    test('creates a new draft with 3 rounds', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/');
      await adminPage.getByRole('button', { name: 'Create Draft' }).click();

      const dialog = adminPage.getByRole('dialog');
      await expect(dialog).toBeVisible();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const formattedDate = tomorrow.toISOString().slice(0, 16);

      await dialog.locator('input#closesAt').fill(formattedDate);
      await dialog.locator('input#rounds').fill('3');

      adminPage.on('dialog', dialog => dialog.accept());
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
      await ndslHeadPage.goto('/dashboard/students/');
      await expect(
        ndslHeadPage.getByText(/Students are still registering|No students have selected/u),
      ).toBeVisible();
    });
  });

  test.describe('History During Registration', () => {
    test('shows Draft #1 in registration phase', async ({ page }) => {
      await page.goto('/history/');
      await expect(page.getByText('Draft #1')).toBeVisible();
      await expect(page.getByText('currently waiting for students to register')).toBeVisible();
    });

    test('detail page shows registration status and creation event', async ({ page }) => {
      await page.goto('/history/1/');
      await expect(page.getByText('registration stage')).toBeVisible();
      const items = page.locator('section ol.border-s li[class*="preset-tonal-"]');
      await expect(items).toHaveCount(1);
      await expect(items.first()).toContainText('Draft #1 was created.');
    });
  });

  test.describe('Student Lab Preferences', () => {
    test('Eager submits full preferences (NDSL > CSL > SCL)', async ({ eagerDrafteePage }) => {
      await eagerDrafteePage.goto('/dashboard/student/');
      await expect(eagerDrafteePage.getByText('Select preferred labs')).toBeVisible();

      await eagerDrafteePage
        .getByRole('button', { name: 'Networks and Distributed Systems Laboratory' })
        .click();
      await eagerDrafteePage.getByRole('button', { name: 'Computer Security Laboratory' }).click();
      await eagerDrafteePage
        .getByRole('button', { name: 'Scientific Computing Laboratory' })
        .click();

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
      await expect(patientCandidatePage.getByText('Select preferred labs')).toBeVisible();

      await patientCandidatePage
        .getByRole('button', { name: 'Computer Security Laboratory' })
        .click();
      await patientCandidatePage
        .getByRole('button', { name: 'Networks and Distributed Systems Laboratory' })
        .click();
      await patientCandidatePage
        .getByRole('button', { name: 'Scientific Computing Laboratory' })
        .click();

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
      await expect(persistentHopefulPage.getByText('Select preferred labs')).toBeVisible();

      await persistentHopefulPage
        .getByRole('button', { name: 'Scientific Computing Laboratory' })
        .click();
      await persistentHopefulPage
        .getByRole('button', { name: 'Computer Vision and Machine Intelligence Laboratory' })
        .click();
      await persistentHopefulPage
        .getByRole('button', { name: 'Algorithms and Complexity Laboratory' })
        .click();

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
      await expect(unluckyFullRankerPage.getByText('Select preferred labs')).toBeVisible();

      await unluckyFullRankerPage
        .getByRole('button', { name: 'Algorithms and Complexity Laboratory' })
        .click();
      await unluckyFullRankerPage
        .getByRole('button', { name: 'Computer Vision and Machine Intelligence Laboratory' })
        .click();
      await unluckyFullRankerPage
        .getByRole('button', { name: 'Networks and Distributed Systems Laboratory' })
        .click();

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
      await expect(partialToDraftedPage.getByText('Select preferred labs')).toBeVisible();

      await partialToDraftedPage
        .getByRole('button', { name: 'Networks and Distributed Systems Laboratory' })
        .click();
      await partialToDraftedPage
        .getByRole('button', { name: 'Computer Security Laboratory' })
        .click();

      partialToDraftedPage.on('dialog', dialog => dialog.accept());
      const responsePromise = partialToDraftedPage.waitForResponse('/dashboard/student/?/submit');
      await partialToDraftedPage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('PartialToLottery submits 1 preference (ACL)', async ({ partialToLotteryPage }) => {
      await partialToLotteryPage.goto('/dashboard/student/');
      await expect(partialToLotteryPage.getByText('Select preferred labs')).toBeVisible();

      await partialToLotteryPage
        .getByRole('button', { name: 'Algorithms and Complexity Laboratory' })
        .click();

      partialToLotteryPage.on('dialog', dialog => dialog.accept());
      const responsePromise = partialToLotteryPage.waitForResponse('/dashboard/student/?/submit');
      await partialToLotteryPage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('NoRank submits 0 prefs (goes directly to lottery)', async ({ noRankStudentPage }) => {
      await noRankStudentPage.goto('/dashboard/student/');
      await expect(noRankStudentPage.getByText('Select preferred labs')).toBeVisible();

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

    test('Idle submits 0 prefs (goes directly to lottery)', async ({ idleBystanderPage }) => {
      await idleBystanderPage.goto('/dashboard/student/');
      await expect(idleBystanderPage.getByText('Select preferred labs')).toBeVisible();

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
    });

    test('starts the draft', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      adminPage.on('dialog', dialog => dialog.accept());
      const responsePromise = adminPage.waitForResponse('/dashboard/drafts/1/?/start');
      await adminPage.getByRole('button', { name: 'Start Draft' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
      await expect(adminPage.getByText(/Round 1/u)).toBeVisible();
    });
  });

  test.describe('Late Registrant', () => {
    test('sees registration closed message', async ({ lateRegistrantPage }) => {
      await lateRegistrantPage.goto('/dashboard/student/');
      await expect(lateRegistrantPage.getByText('Registration Closed')).toBeVisible();
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

  test.describe('Faculty Before Round 1 Submission', () => {
    test('NDSL sees 1st-choice students (Eager, PartialToDrafted)', async ({ ndslHeadPage }) => {
      await ndslHeadPage.goto('/dashboard/students/');
      await expect(ndslHeadPage.getByRole('button', { name: /Eager/u })).toBeVisible();
      await expect(ndslHeadPage.getByRole('button', { name: /Partial/u })).toBeVisible();
    });
  });

  test.describe('Round 1 — 1st choice', () => {
    test('NDSL selects Eager', async ({ ndslHeadPage }) => {
      await ndslHeadPage.goto('/dashboard/students/');
      await ndslHeadPage.getByRole('button', { name: /Eager/u }).click();
      ndslHeadPage.on('dialog', dialog => dialog.accept());
      const responsePromise = ndslHeadPage.waitForResponse('/dashboard/students/?/rankings');
      await ndslHeadPage.getByRole('button', { name: 'Submit' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('CSL selects Patient', async ({ cslHeadPage }) => {
      await cslHeadPage.goto('/dashboard/students/');
      await cslHeadPage.getByRole('button', { name: /Patient/u }).click();
      cslHeadPage.on('dialog', dialog => dialog.accept());
      const responsePromise = cslHeadPage.waitForResponse('/dashboard/students/?/rankings');
      await cslHeadPage.getByRole('button', { name: 'Submit' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('SCL skips (sees Persistent)', async ({ sclHeadPage }) => {
      await sclHeadPage.goto('/dashboard/students/');
      await expect(sclHeadPage.getByRole('button', { name: /Persistent/u })).toBeVisible();
      sclHeadPage.on('dialog', dialog => dialog.accept());
      const responsePromise = sclHeadPage.waitForResponse('/dashboard/students/?/rankings');
      await sclHeadPage.getByRole('button', { name: 'Submit' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    // CVMIL: no 1st-choice students → auto-acknowledged

    test('ACL skips (sees Unlucky, PartialToLottery)', async ({ aclHeadPage }) => {
      await aclHeadPage.goto('/dashboard/students/');
      await expect(aclHeadPage.getByRole('button', { name: /Unlucky/u })).toBeVisible();
      aclHeadPage.on('dialog', dialog => dialog.accept());
      const responsePromise = aclHeadPage.waitForResponse('/dashboard/students/?/rankings');
      await aclHeadPage.getByRole('button', { name: 'Submit' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });
  });

  test.describe('Verify Round 2', () => {
    test('draft is now in Round 2', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await expect(adminPage.getByText(/Round 2/u)).toBeVisible();
    });
  });

  test.describe('Round 2 — 2nd choice', () => {
    // NDSL: Patient ranked NDSL 2nd, but Patient is drafted → no undrafted 2nd-choice students → auto-acknowledged
    // SCL, ACL: no undrafted 2nd-choice students → auto-acknowledged

    test('CSL selects PartialToDrafted', async ({ cslHeadPage }) => {
      await cslHeadPage.goto('/dashboard/students/');
      await expect(cslHeadPage.getByRole('button', { name: /Partial/u })).toBeVisible();
      await cslHeadPage.getByRole('button', { name: /Partial/u }).click();
      cslHeadPage.on('dialog', dialog => dialog.accept());
      const responsePromise = cslHeadPage.waitForResponse('/dashboard/students/?/rankings');
      await cslHeadPage.getByRole('button', { name: 'Submit' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('CVMIL skips (sees Persistent, Unlucky)', async ({ cvmilHeadPage }) => {
      await cvmilHeadPage.goto('/dashboard/students/');
      await expect(cvmilHeadPage.getByRole('button', { name: /Persistent/u })).toBeVisible();
      await expect(cvmilHeadPage.getByRole('button', { name: /Unlucky/u })).toBeVisible();
      cvmilHeadPage.on('dialog', dialog => dialog.accept());
      const responsePromise = cvmilHeadPage.waitForResponse('/dashboard/students/?/rankings');
      await cvmilHeadPage.getByRole('button', { name: 'Submit' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });
  });

  test.describe('Verify Round 3', () => {
    test('draft is now in Round 3', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await expect(adminPage.getByText(/Round 3/u)).toBeVisible();
    });
  });

  test.describe('Round 3 — 3rd choice', () => {
    // CSL: quota full (2/2) → auto-acknowledged
    // SCL: Eager ranked SCL 3rd, but Eager is drafted → no undrafted students → auto-acknowledged
    // CVMIL: no 3rd-choice students → auto-acknowledged

    test('NDSL selects Unlucky', async ({ ndslHeadPage }) => {
      await ndslHeadPage.goto('/dashboard/students/');
      await expect(ndslHeadPage.getByRole('button', { name: /Unlucky/u })).toBeVisible();
      await ndslHeadPage.getByRole('button', { name: /Unlucky/u }).click();
      ndslHeadPage.on('dialog', dialog => dialog.accept());
      const responsePromise = ndslHeadPage.waitForResponse('/dashboard/students/?/rankings');
      await ndslHeadPage.getByRole('button', { name: 'Submit' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('ACL skips (sees Persistent)', async ({ aclHeadPage }) => {
      await aclHeadPage.goto('/dashboard/students/');
      await expect(aclHeadPage.getByRole('button', { name: /Persistent/u })).toBeVisible();
      aclHeadPage.on('dialog', dialog => dialog.accept());
      const responsePromise = aclHeadPage.waitForResponse('/dashboard/students/?/rankings');
      await aclHeadPage.getByRole('button', { name: 'Submit' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });
  });

  test.describe('History During Lottery', () => {
    test('shows Draft #1 in lottery phase', async ({ page }) => {
      await page.goto('/history/');
      await expect(page.getByText('Draft #1')).toBeVisible();
      await expect(page.getByText(/lottery stage/u)).toBeVisible();
    });

    test('detail page shows ordered round events', async ({ page }) => {
      await page.goto('/history/1/');
      await expect(page.getByText('lottery stage')).toBeVisible();

      const items = page.locator('section ol.border-s li[class*="preset-tonal-"]');
      const texts = await items.allTextContents();

      function idx(regex: RegExp) {
        return texts.findIndex(t => regex.test(t));
      }

      // No conclusion event yet
      expect(idx(/was concluded/u)).toBe(-1);

      // Known faculty selections exist
      const ndslR3 = idx(/ndsl.*3rd batch/isu);
      const cslR2 = idx(/csl.*2nd batch/isu);
      const ndslR1 = idx(/ndsl.*1st batch/isu);
      const cslR1 = idx(/csl.*1st batch/isu);
      expect(ndslR3).toBeGreaterThanOrEqual(0);
      expect(cslR2).toBeGreaterThanOrEqual(0);
      expect(ndslR1).toBeGreaterThanOrEqual(0);
      expect(cslR1).toBeGreaterThanOrEqual(0);

      // Round 3 selections before Round 2 before Round 1 (DESC order)
      expect(ndslR3).toBeLessThan(cslR2);
      expect(cslR2).toBeLessThan(ndslR1);
      expect(cslR2).toBeLessThan(cslR1);

      // System skips exist (non-deterministic order, just check presence)
      expect(idx(/system has skipped/isu)).toBeGreaterThanOrEqual(0);

      // Creation is last
      expect(idx(/was created/u)).toBe(texts.length - 1);
    });
  });

  test.describe('Lottery Phase', () => {
    test('draft enters lottery phase', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await expect(adminPage.getByRole('heading', { name: 'Lottery Phase' })).toBeVisible();
    });

    test('sees remaining students in lottery', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await expect(adminPage.getByText('Eligible for Lottery (4)')).toBeVisible();
    });
  });

  test.describe('Faculty Lottery Phase', () => {
    test('sees lottery pending message', async ({ ndslHeadPage }) => {
      await ndslHeadPage.goto('/dashboard/students/');
      await expect(ndslHeadPage.getByText('The draft is now in the lottery stage')).toBeVisible();
    });
  });

  test.describe('Conclude Error Case', () => {
    test('conclude fails with mismatched quota', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      adminPage.on('dialog', dialog => dialog.accept());

      await expect(adminPage.getByRole('button', { name: 'Conclude Draft' })).toBeVisible();
      const responsePromise = adminPage.waitForResponse('/dashboard/drafts/1/?/conclude');
      await adminPage.getByRole('button', { name: 'Conclude Draft' }).click();

      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('failure');
      expect(responseData.status).toBe(403);

      // Page stays on lottery — button re-enables
      await expect(adminPage.getByRole('button', { name: 'Conclude Draft' })).toBeEnabled();
    });
  });

  test.describe('Manual Intervention', () => {
    test('assigns first eligible student to a lab', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
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

    test('eligible count drops to 3', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await expect(adminPage.getByText('Eligible for Lottery (3)')).toBeVisible();
    });
  });

  test.describe('Adjust Quotas for Remaining Students', () => {
    test('sets lottery snapshots to match 3 remaining students', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      const editor = adminPage.locator('#draft-quota-editor-lottery');
      await expect(editor).toBeVisible();

      await editor.locator('input[name="ndsl"]').fill('0');
      await editor.locator('input[name="csl"]').fill('0');
      await editor.locator('input[name="scl"]').fill('1');
      await editor.locator('input[name="cvmil"]').fill('1');
      await editor.locator('input[name="acl"]').fill('1');

      const responsePromise = adminPage.waitForResponse('/dashboard/drafts/1/?/quota');
      await editor.getByRole('button', { name: 'Update Lottery Snapshots' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });
  });

  test.describe('Conclude Draft', () => {
    test('concludes draft successfully', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      adminPage.on('dialog', dialog => dialog.accept());

      await expect(adminPage.getByRole('button', { name: 'Conclude Draft' })).toBeVisible();
      const responsePromise = adminPage.waitForResponse('/dashboard/drafts/1/?/conclude');
      await adminPage.getByRole('button', { name: 'Conclude Draft' }).click();

      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });
  });

  test.describe('Admin Concluded Breakdown', () => {
    test('shows expected aggregate quota values', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await expect(adminPage.locator('#admin-concluded-breakdown')).toBeVisible();
      await expect(adminPage.locator('#quota-initial')).toHaveText('8');
      await expect(adminPage.locator('#quota-interventions')).toHaveText('1');
      await expect(adminPage.locator('#quota-concluded')).toHaveText('11');
    });

    test('shows regular, intervention, and lottery sections in order', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');

      const sectionIds = await adminPage
        .locator(
          '#section-regular-drafted, #section-intervention-drafted, #section-lottery-drafted',
        )
        .evaluateAll(nodes => nodes.map(node => node.id));
      expect(sectionIds).toEqual([
        'section-regular-drafted',
        'section-intervention-drafted',
        'section-lottery-drafted',
      ]);

      await expect(adminPage.locator('#section-regular-drafted')).toContainText(
        'Regular Drafted (4)',
      );
      await expect(adminPage.locator('#section-intervention-drafted')).toContainText(
        'Intervention Drafted (1)',
      );
      await expect(adminPage.locator('#section-undrafted-after-regular')).toContainText(
        'Undrafted After Regular (4)',
      );
      await expect(adminPage.locator('#section-lottery-drafted')).toContainText(
        'Lottery Drafted (3)',
      );

      const firstInterventionDate = adminPage.locator('[id^="intervention-date-"]').first();
      await expect(firstInterventionDate).toBeVisible();
      const interventionDateText = (await firstInterventionDate.textContent())?.trim() ?? '';
      expect(interventionDateText.length).toBeGreaterThan(0);
    });
  });

  test.describe('History After Conclusion', () => {
    test('shows Draft #1 as concluded', async ({ page }) => {
      await page.goto('/history/');
      await expect(page.getByText('Draft #1')).toBeVisible();
      await expect(page.getByText(/was held from/u)).toBeVisible();
      await expect(page.getByText(/over 3 rounds/u)).toBeVisible();
    });

    test('detail page shows concluded status and ordered timeline', async ({ page }) => {
      await page.goto('/history/1/');

      // Status banner
      await expect(page.getByText(/was held from/u)).toBeVisible();
      await expect(page.getByText(/over 3 rounds/u)).toBeVisible();

      const items = page.locator('section ol.border-s li[class*="preset-tonal-"]');
      const texts = await items.allTextContents();

      function idx(regex: RegExp) {
        return texts.findIndex(t => regex.test(t));
      }

      // Concluded is first, created is last
      expect(idx(/was concluded/u)).toBe(0);
      expect(idx(/was created/u)).toBe(texts.length - 1);

      // Lottery events exist and come before faculty round selections
      const firstLottery = idx(/obtained a batch.*lottery/isu);
      const ndslR3 = idx(/ndsl.*3rd batch/isu);
      const cslR2 = idx(/csl.*2nd batch/isu);
      const ndslR1 = idx(/ndsl.*1st batch/isu);
      const cslR1 = idx(/csl.*1st batch/isu);
      expect(firstLottery).toBeGreaterThan(0);
      expect(firstLottery).toBeLessThan(ndslR3);

      // Faculty selections in correct round order (R3 > R2 > R1)
      expect(ndslR3).toBeLessThan(cslR2);
      expect(cslR2).toBeLessThan(ndslR1);
      expect(cslR2).toBeLessThan(cslR1);

      // System skip events exist (non-deterministic order, just check presence)
      expect(idx(/system has skipped/isu)).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Drafts Table Final State', () => {
    test('shows draft with concluded status', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/');
      await expect(adminPage.getByText('#1')).toBeVisible();
      await expect(adminPage.getByText('Concluded')).toBeVisible();
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
      // Late registrant missed registration — draft is concluded so no active draft
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
    test('archives ACL and verifies it appears in archived labs', async ({ adminPage }) => {
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

      await adminPage.getByRole('tab', { name: /Archived Labs/u }).click();
      await expect(adminPage.getByText('Algorithms and Complexity Laboratory')).toBeVisible();
    });

    test('sets minimal quotas for the second draft cycle', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/labs/');

      await adminPage.locator('input[name="ndsl"]').fill('1');
      await adminPage.locator('input[name="csl"]').fill('1');
      await adminPage.locator('input[name="scl"]').fill('1');
      await adminPage.locator('input[name="cvmil"]').fill('0');

      const responsePromise = adminPage.waitForResponse('/dashboard/labs/?/quota');
      await adminPage.getByRole('button', { name: 'Update Quotas' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('creates Draft #2 with 2 rounds', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/');
      await adminPage.getByRole('button', { name: 'Create Draft' }).click();

      const dialog = adminPage.getByRole('dialog');
      await expect(dialog).toBeVisible();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const formattedDate = tomorrow.toISOString().slice(0, 16);

      await dialog.locator('input#closesAt').fill(formattedDate);
      await dialog.locator('input#rounds').fill('2');

      adminPage.on('dialog', dialog => dialog.accept());
      const responsePromise = adminPage.waitForResponse('/dashboard/drafts/?/init');
      await dialog.getByRole('button', { name: 'Create Draft' }).click();

      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');

      await expect(adminPage.getByText('#2')).toBeVisible();
      await expect(adminPage.getByText('Registration')).toBeVisible();
    });
  });

  test.describe('Second Draft — Student Registration', () => {
    test('SecondNdslFirstChoice completes profile and submits rankings (NDSL > CSL)', async ({
      secondRoundNdslFirstChoicePage,
    }) => {
      await secondRoundNdslFirstChoicePage.goto('/dashboard/student/');
      await secondRoundNdslFirstChoicePage.getByLabel('Student Number').fill('202112360');
      {
        const profileResponsePromise =
          secondRoundNdslFirstChoicePage.waitForResponse('/dashboard/?/profile');
        await secondRoundNdslFirstChoicePage
          .getByRole('button', { name: 'Complete Profile' })
          .click();
        const profileResponse = await profileResponsePromise;
        const profileResponseData = await profileResponse.json();
        expect(profileResponseData.type).toBe('success');
      }

      await secondRoundNdslFirstChoicePage
        .getByRole('button', { name: 'Networks and Distributed Systems Laboratory' })
        .click();
      await secondRoundNdslFirstChoicePage
        .getByRole('button', { name: 'Computer Security Laboratory' })
        .click();

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

    test('SecondCslFirstChoice completes profile and submits rankings (CSL > NDSL)', async ({
      secondRoundCslFirstChoicePage,
    }) => {
      await secondRoundCslFirstChoicePage.goto('/dashboard/student/');
      await secondRoundCslFirstChoicePage.getByLabel('Student Number').fill('202112361');
      {
        const profileResponsePromise =
          secondRoundCslFirstChoicePage.waitForResponse('/dashboard/?/profile');
        await secondRoundCslFirstChoicePage
          .getByRole('button', { name: 'Complete Profile' })
          .click();
        const profileResponse = await profileResponsePromise;
        const profileResponseData = await profileResponse.json();
        expect(profileResponseData.type).toBe('success');
      }

      await secondRoundCslFirstChoicePage
        .getByRole('button', { name: 'Computer Security Laboratory' })
        .click();
      await secondRoundCslFirstChoicePage
        .getByRole('button', { name: 'Networks and Distributed Systems Laboratory' })
        .click();

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

    test('SecondSclSecondChoice completes profile and submits rankings (NDSL > SCL)', async ({
      secondRoundSclSecondChoicePage,
    }) => {
      await secondRoundSclSecondChoicePage.goto('/dashboard/student/');
      await secondRoundSclSecondChoicePage.getByLabel('Student Number').fill('202112362');
      {
        const profileResponsePromise =
          secondRoundSclSecondChoicePage.waitForResponse('/dashboard/?/profile');
        await secondRoundSclSecondChoicePage
          .getByRole('button', { name: 'Complete Profile' })
          .click();
        const profileResponse = await profileResponsePromise;
        const profileResponseData = await profileResponse.json();
        expect(profileResponseData.type).toBe('success');
      }

      await secondRoundSclSecondChoicePage
        .getByRole('button', { name: 'Networks and Distributed Systems Laboratory' })
        .click();
      await secondRoundSclSecondChoicePage
        .getByRole('button', { name: 'Scientific Computing Laboratory' })
        .click();

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

      await expect(adminPage.getByText(/Round 1/u)).toBeVisible();
    });

    test('Round 1: NDSL selects SecondNdsl', async ({ ndslHeadPage }) => {
      await ndslHeadPage.goto('/dashboard/students/');
      await expect(ndslHeadPage.getByRole('button', { name: /SecondNdsl/u })).toBeVisible();
      await expect(ndslHeadPage.getByRole('button', { name: /SecondScl/u })).toBeVisible();

      await ndslHeadPage.getByRole('button', { name: /SecondNdsl/u }).click();
      ndslHeadPage.on('dialog', dialog => dialog.accept());
      const responsePromise = ndslHeadPage.waitForResponse('/dashboard/students/?/rankings');
      await ndslHeadPage.getByRole('button', { name: 'Submit' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('Round 1: CSL selects SecondCsl', async ({ cslHeadPage }) => {
      await cslHeadPage.goto('/dashboard/students/');
      await expect(cslHeadPage.getByRole('button', { name: /SecondCsl/u })).toBeVisible();

      await cslHeadPage.getByRole('button', { name: /SecondCsl/u }).click();
      cslHeadPage.on('dialog', dialog => dialog.accept());
      const responsePromise = cslHeadPage.waitForResponse('/dashboard/students/?/rankings');
      await cslHeadPage.getByRole('button', { name: 'Submit' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('Draft #2 reaches Round 2', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/2/');
      await expect(adminPage.getByText(/Round 2/u)).toBeVisible();
    });

    test('Round 2: SCL selects SecondScl', async ({ sclHeadPage }) => {
      await sclHeadPage.goto('/dashboard/students/');
      await expect(sclHeadPage.getByRole('button', { name: /SecondScl/u })).toBeVisible();

      await sclHeadPage.getByRole('button', { name: /SecondScl/u }).click();
      sclHeadPage.on('dialog', dialog => dialog.accept());
      const responsePromise = sclHeadPage.waitForResponse('/dashboard/students/?/rankings');
      await sclHeadPage.getByRole('button', { name: 'Submit' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
    });

    test('lottery stage shows zero eligible students', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/2/');
      await expect(adminPage.getByRole('heading', { name: 'Lottery Phase' })).toBeVisible();
      await expect(adminPage.getByText('Eligible for Lottery (0)')).toBeVisible();
      await expect(
        adminPage.getByText('Congratulations! All participants have been drafted.'),
      ).toBeVisible();
    });

    test('sets lottery snapshots to zero and concludes Draft #2', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/2/');
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

      adminPage.on('dialog', dialog => dialog.accept());
      const concludeResponsePromise = adminPage.waitForResponse('/dashboard/drafts/2/?/conclude');
      await adminPage.getByRole('button', { name: 'Conclude Draft' }).click();

      const concludeResponse = await concludeResponsePromise;
      const concludeResponseData = await concludeResponse.json();
      expect(concludeResponseData.type).toBe('success');
    });
  });

  test.describe('Second Draft — Dashboard And History Verification', () => {
    test('admin concluded breakdown is correct for Draft #2', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/2/');
      await expect(adminPage.locator('#admin-concluded-breakdown')).toBeVisible();
      await expect(adminPage.locator('#quota-initial')).toHaveText('3');
      await expect(adminPage.locator('#quota-interventions')).toHaveText('0');
      await expect(adminPage.locator('#quota-concluded')).toHaveText('3');
      await expect(adminPage.locator('#section-regular-drafted')).toContainText(
        'Regular Drafted (3)',
      );
      await expect(adminPage.locator('#section-intervention-drafted')).toContainText(
        'Intervention Drafted (0)',
      );
      await expect(adminPage.locator('#section-undrafted-after-regular')).toContainText(
        'Undrafted After Regular (0)',
      );
      await expect(adminPage.locator('#section-lottery-drafted')).toContainText(
        'Lottery Drafted (0)',
      );
    });

    test('drafts table shows Draft #2 and Draft #1 concluded', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/');
      await expect(adminPage.getByText('#2')).toBeVisible();
      await expect(adminPage.getByText('#1')).toBeVisible();
      await expect(adminPage.getByText('Concluded')).toHaveCount(2);
    });

    test('history index and Draft #2 detail reflect a 2-round conclusion', async ({ page }) => {
      await page.goto('/history/');
      await expect(page.getByText('Draft #2')).toBeVisible();
      await expect(page.getByText(/over 2 rounds/u)).toBeVisible();

      await page.goto('/history/2/');
      await expect(page.getByText(/was held from/u)).toBeVisible();
      await expect(page.getByText(/over 2 rounds/u)).toBeVisible();

      const items = page.locator('section ol.border-s li[class*="preset-tonal-"]');
      const texts = await items.allTextContents();
      function idx(regex: RegExp) {
        return texts.findIndex(t => regex.test(t));
      }

      const sclR2 = idx(/scl.*2nd batch/isu);
      const ndslR1 = idx(/ndsl.*1st batch/isu);
      const cslR1 = idx(/csl.*1st batch/isu);

      expect(idx(/was concluded/u)).toBe(0);
      expect(idx(/was created/u)).toBe(texts.length - 1);
      expect(sclR2).toBeGreaterThanOrEqual(0);
      expect(ndslR1).toBeGreaterThanOrEqual(0);
      expect(cslR1).toBeGreaterThanOrEqual(0);
      expect(sclR2).toBeLessThan(ndslR1);
      expect(sclR2).toBeLessThan(cslR1);

      // Second draft had no randomized lottery assignments.
      expect(idx(/obtained a batch.*lottery/isu)).toBe(-1);
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

    test('NDSL, CSL, and SCL heads can view Draft 2 assignees', async ({
      ndslHeadPage,
      cslHeadPage,
      sclHeadPage,
    }) => {
      await ndslHeadPage.goto('/dashboard/lab/');
      await ndslHeadPage.getByRole('button', { name: /Draft 2/u }).click();
      await expect(ndslHeadPage.getByText(/SecondNdsl/u)).toBeVisible();

      await cslHeadPage.goto('/dashboard/lab/');
      await cslHeadPage.getByRole('button', { name: /Draft 2/u }).click();
      await expect(cslHeadPage.getByText(/SecondCsl/u)).toBeVisible();

      await sclHeadPage.goto('/dashboard/lab/');
      await sclHeadPage.getByRole('button', { name: /Draft 2/u }).click();
      await expect(sclHeadPage.getByText(/SecondScl/u)).toBeVisible();
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
  });
});
