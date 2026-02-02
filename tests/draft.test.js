import { expect } from '@playwright/test';

import { test } from './fixtures/users';

test.describe('Draft Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  test.describe('Initial State', () => {
    test('history page shows no drafts', async ({ page, database: _ }) => {
      await page.goto('/history/');
      await expect(page.getByText('No drafts have been recorded yet')).toBeVisible();
    });

    test('admin sees faculty in users page', async ({
      adminPage,
      ndslHeadPage: _ndsl,
      cslHeadPage: _csl,
      sclHeadPage: _scl,
      cvmilHeadPage: _cvmil,
      aclHeadPage: _acl,
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
      await eagerDrafteePage.getByRole('button', { name: 'Complete Profile' }).click();
      await expect(eagerDrafteePage.getByText('Complete Your Profile')).not.toBeVisible();
    });

    test('Patient completes profile', async ({ patientCandidatePage }) => {
      await patientCandidatePage.getByLabel('Student Number').fill('202012346');
      await patientCandidatePage.getByRole('button', { name: 'Complete Profile' }).click();
      await expect(patientCandidatePage.getByText('Complete Your Profile')).not.toBeVisible();
    });

    test('Persistent completes profile', async ({ persistentHopefulPage }) => {
      await persistentHopefulPage.getByLabel('Student Number').fill('202012347');
      await persistentHopefulPage.getByRole('button', { name: 'Complete Profile' }).click();
      await expect(persistentHopefulPage.getByText('Complete Your Profile')).not.toBeVisible();
    });

    test('Unlucky completes profile', async ({ unluckyFullRankerPage }) => {
      await unluckyFullRankerPage.getByLabel('Student Number').fill('202012348');
      await unluckyFullRankerPage.getByRole('button', { name: 'Complete Profile' }).click();
      await expect(unluckyFullRankerPage.getByText('Complete Your Profile')).not.toBeVisible();
    });

    test('PartialToDrafted completes profile', async ({ partialToDraftedPage }) => {
      await partialToDraftedPage.getByLabel('Student Number').fill('202012349');
      await partialToDraftedPage.getByRole('button', { name: 'Complete Profile' }).click();
      await expect(partialToDraftedPage.getByText('Complete Your Profile')).not.toBeVisible();
    });

    test('PartialToLottery completes profile', async ({ partialToLotteryPage }) => {
      await partialToLotteryPage.getByLabel('Student Number').fill('202012350');
      await partialToLotteryPage.getByRole('button', { name: 'Complete Profile' }).click();
      await expect(partialToLotteryPage.getByText('Complete Your Profile')).not.toBeVisible();
    });

    test('NoRank completes profile', async ({ noRankStudentPage }) => {
      await noRankStudentPage.getByLabel('Student Number').fill('202012351');
      await noRankStudentPage.getByRole('button', { name: 'Complete Profile' }).click();
      await expect(noRankStudentPage.getByText('Complete Your Profile')).not.toBeVisible();
    });

    test('Idle completes profile', async ({ idleBystanderPage }) => {
      await idleBystanderPage.getByLabel('Student Number').fill('202012353');
      await idleBystanderPage.getByRole('button', { name: 'Complete Profile' }).click();
      await expect(idleBystanderPage.getByText('Complete Your Profile')).not.toBeVisible();
    });

    test('Late completes profile', async ({ lateRegistrantPage }) => {
      await lateRegistrantPage.getByLabel('Student Number').fill('202012352');
      await lateRegistrantPage.getByRole('button', { name: 'Complete Profile' }).click();
      await expect(lateRegistrantPage.getByText('Complete Your Profile')).not.toBeVisible();
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
      await adminPage.getByRole('button', { name: 'Update Quotas' }).click();
      await expect(adminPage.getByText('Successfully updated the lab quotas')).toBeVisible();
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
      await dialog.getByRole('button', { name: 'Create Draft' }).click();

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
      await eagerDrafteePage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
      await expect(eagerDrafteePage.getByText('Uploaded your lab preferences')).toBeVisible();
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
      await patientCandidatePage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
      await expect(patientCandidatePage.getByText('Uploaded your lab preferences')).toBeVisible();
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
      await persistentHopefulPage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
      await expect(persistentHopefulPage.getByText('Uploaded your lab preferences')).toBeVisible();
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
      await unluckyFullRankerPage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
      await expect(unluckyFullRankerPage.getByText('Uploaded your lab preferences')).toBeVisible();
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
      await partialToDraftedPage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
      await expect(partialToDraftedPage.getByText('Uploaded your lab preferences')).toBeVisible();
    });

    test('PartialToLottery submits 1 preference (ACL)', async ({ partialToLotteryPage }) => {
      await partialToLotteryPage.goto('/dashboard/student/');
      await expect(partialToLotteryPage.getByText('Select preferred labs')).toBeVisible();

      await partialToLotteryPage
        .getByRole('button', { name: 'Algorithms and Complexity Laboratory' })
        .click();

      partialToLotteryPage.on('dialog', dialog => dialog.accept());
      await partialToLotteryPage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
      await expect(partialToLotteryPage.getByText('Uploaded your lab preferences')).toBeVisible();
    });

    test('NoRank submits 0 prefs (goes directly to lottery)', async ({ noRankStudentPage }) => {
      await noRankStudentPage.goto('/dashboard/student/');
      await expect(noRankStudentPage.getByText('Select preferred labs')).toBeVisible();

      noRankStudentPage.on('dialog', dialog => dialog.accept());
      await noRankStudentPage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
      await expect(noRankStudentPage.getByText('Uploaded your lab preferences')).toBeVisible();
    });

    test('Idle submits 0 prefs (goes directly to lottery)', async ({ idleBystanderPage }) => {
      await idleBystanderPage.goto('/dashboard/student/');
      await expect(idleBystanderPage.getByText('Select preferred labs')).toBeVisible();

      idleBystanderPage.on('dialog', dialog => dialog.accept());
      await idleBystanderPage.getByRole('button', { name: 'Submit Lab Preferences' }).click();
      await expect(idleBystanderPage.getByText('Uploaded your lab preferences')).toBeVisible();
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
      await adminPage.getByRole('button', { name: 'Start Draft' }).click();
      await expect(adminPage.getByText(/Round 1/u)).toBeVisible();
    });
  });

  test.describe('Late Registrant', () => {
    test('sees registration closed message', async ({ lateRegistrantPage }) => {
      await lateRegistrantPage.goto('/dashboard/student/');
      await expect(lateRegistrantPage.getByText('Registration Closed')).toBeVisible();
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
      await ndslHeadPage.getByRole('button', { name: 'Submit' }).click();
      await expect(ndslHeadPage.getByText(/submitted|selected/iu)).toBeVisible();
    });

    test('CSL selects Patient', async ({ cslHeadPage }) => {
      await cslHeadPage.goto('/dashboard/students/');
      await cslHeadPage.getByRole('button', { name: /Patient/u }).click();
      cslHeadPage.on('dialog', dialog => dialog.accept());
      await cslHeadPage.getByRole('button', { name: 'Submit' }).click();
      await expect(cslHeadPage.getByText(/submitted|selected/iu)).toBeVisible();
    });

    test('SCL skips (sees Persistent)', async ({ sclHeadPage }) => {
      await sclHeadPage.goto('/dashboard/students/');
      await expect(sclHeadPage.getByRole('button', { name: /Persistent/u })).toBeVisible();
      sclHeadPage.on('dialog', dialog => dialog.accept());
      await sclHeadPage.getByRole('button', { name: 'Submit' }).click();
    });

    // CVMIL: no 1st-choice students → auto-acknowledged

    test('ACL skips (sees Unlucky, PartialToLottery)', async ({ aclHeadPage }) => {
      await aclHeadPage.goto('/dashboard/students/');
      await expect(aclHeadPage.getByRole('button', { name: /Unlucky/u })).toBeVisible();
      aclHeadPage.on('dialog', dialog => dialog.accept());
      await aclHeadPage.getByRole('button', { name: 'Submit' }).click();
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
      await cslHeadPage.getByRole('button', { name: 'Submit' }).click();
      await expect(cslHeadPage.getByText(/submitted|selected/iu)).toBeVisible();
    });

    test('CVMIL skips (sees Persistent, Unlucky)', async ({ cvmilHeadPage }) => {
      await cvmilHeadPage.goto('/dashboard/students/');
      await expect(cvmilHeadPage.getByRole('button', { name: /Persistent/u })).toBeVisible();
      await expect(cvmilHeadPage.getByRole('button', { name: /Unlucky/u })).toBeVisible();
      cvmilHeadPage.on('dialog', dialog => dialog.accept());
      await cvmilHeadPage.getByRole('button', { name: 'Submit' }).click();
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
      await ndslHeadPage.getByRole('button', { name: 'Submit' }).click();
      await expect(ndslHeadPage.getByText(/submitted|selected/iu)).toBeVisible();
    });

    test('ACL skips (sees Persistent)', async ({ aclHeadPage }) => {
      await aclHeadPage.goto('/dashboard/students/');
      await expect(aclHeadPage.getByRole('button', { name: /Persistent/u })).toBeVisible();
      aclHeadPage.on('dialog', dialog => dialog.accept());
      await aclHeadPage.getByRole('button', { name: 'Submit' }).click();
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

      /** @param {RegExp} regex */
      function idx(regex) {
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
      await adminPage.getByRole('button', { name: 'Conclude Draft' }).click();

      await expect(
        adminPage.getByText(
          'The total of all lab quota does not match the number of eligible students in the lottery.',
        ),
      ).toBeVisible();

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
      await adminPage.getByRole('button', { name: 'Apply Interventions' }).click();
      await expect(adminPage.getByText('Successfully applied the interventions')).toBeVisible();
    });

    test('eligible count drops to 3', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      await expect(adminPage.getByText('Eligible for Lottery (3)')).toBeVisible();
    });
  });

  test.describe('Adjust Quotas for Remaining Students', () => {
    test('sets quotas to match 3 remaining students', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/labs/');
      await adminPage.locator('input[name="ndsl"]').fill('0');
      await adminPage.locator('input[name="csl"]').fill('0');
      await adminPage.locator('input[name="scl"]').fill('1');
      await adminPage.locator('input[name="cvmil"]').fill('1');
      await adminPage.locator('input[name="acl"]').fill('1');
      await adminPage.getByRole('button', { name: 'Update Quotas' }).click();
      await expect(adminPage.getByText('Successfully updated the lab quotas')).toBeVisible();
    });
  });

  test.describe('Conclude Draft', () => {
    test('concludes draft successfully', async ({ adminPage }) => {
      await adminPage.goto('/dashboard/drafts/1/');
      adminPage.on('dialog', dialog => dialog.accept());

      await expect(adminPage.getByRole('button', { name: 'Conclude Draft' })).toBeVisible();
      await adminPage.getByRole('button', { name: 'Conclude Draft' }).click();

      await expect(adminPage.getByText('Draft Concluded')).toBeVisible();
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

      /** @param {RegExp} regex */
      function idx(regex) {
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
});
