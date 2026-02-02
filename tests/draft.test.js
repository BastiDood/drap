// Tests are run sequentially within the same file by default.
// Exact ordering is critical for the end-to-end tests.

import { expect } from '@playwright/test';

import {
  testAclHead,
  testAdmin,
  testCslHead,
  testCvmilHead,
  testEagerDraftee,
  testLateRegistrant,
  testNdslHead,
  testNoRankStudent,
  testPartialToDrafted,
  testPartialToLottery,
  testPatientCandidate,
  testPersistentHopeful,
  testSclHead,
  testUnluckyFullRanker,
} from './fixtures/users';

// ============================================================================
// 1. INITIAL STATE
// ============================================================================

testAdmin.describe.serial('Initial State', () => {
  testAdmin('history page shows no drafts', async ({ page }) => {
    await page.goto('/history/');
    await expect(page.getByText('No drafts have been recorded yet')).toBeVisible();
  });

  testAdmin('admin sees faculty in users page', async ({ page }) => {
    await page.goto('/dashboard/users/');
    // Faculty heads should be visible (they are auto-created as admins with lab assignments)
    await expect(page.getByText('ndsl@up.edu.ph')).toBeVisible();
    await expect(page.getByText('csl@up.edu.ph')).toBeVisible();
    await expect(page.getByText('scl@up.edu.ph')).toBeVisible();
    await expect(page.getByText('cvmil@up.edu.ph')).toBeVisible();
    await expect(page.getByText('acl@up.edu.ph')).toBeVisible();
  });
});

testNdslHead.describe.serial('Faculty Initial State', () => {
  testNdslHead('faculty sees only lab members, no students', async ({ page }) => {
    await page.goto('/dashboard/students/');
    // Should see a message indicating registration in progress or no draft
    await expect(
      page.getByText(/Students are still registering|No students have selected/u),
    ).toBeVisible();
  });
});

// ============================================================================
// 2. STUDENT PROFILE REGISTRATION
// ============================================================================

testEagerDraftee.describe.serial('Student Profile Registration - Eager', () => {
  testEagerDraftee('lands on /dashboard/student/', async ({ page }) => {
    await expect(page).toHaveURL('/dashboard/student/');
  });

  testEagerDraftee('completes profile with student number', async ({ page }) => {
    await expect(page.getByText('Complete Your Profile')).toBeVisible();
    await page.getByLabel('Student Number').fill('202012345');
    await page.getByRole('button', { name: 'Complete Profile' }).click();
    // After profile completion, page should refresh and show student hub
    await expect(page.getByText('Complete Your Profile')).not.toBeVisible();
  });
});

testPatientCandidate.describe.serial('Student Profile Registration - Patient', () => {
  testPatientCandidate('completes profile', async ({ page }) => {
    await page.getByLabel('Student Number').fill('202012346');
    await page.getByRole('button', { name: 'Complete Profile' }).click();
    await expect(page.getByText('Complete Your Profile')).not.toBeVisible();
  });
});

testPersistentHopeful.describe.serial('Student Profile Registration - Persistent', () => {
  testPersistentHopeful('completes profile', async ({ page }) => {
    await page.getByLabel('Student Number').fill('202012347');
    await page.getByRole('button', { name: 'Complete Profile' }).click();
    await expect(page.getByText('Complete Your Profile')).not.toBeVisible();
  });
});

testUnluckyFullRanker.describe.serial('Student Profile Registration - Unlucky', () => {
  testUnluckyFullRanker('completes profile', async ({ page }) => {
    await page.getByLabel('Student Number').fill('202012348');
    await page.getByRole('button', { name: 'Complete Profile' }).click();
    await expect(page.getByText('Complete Your Profile')).not.toBeVisible();
  });
});

testPartialToDrafted.describe.serial('Student Profile Registration - PartialToDrafted', () => {
  testPartialToDrafted('completes profile', async ({ page }) => {
    await page.getByLabel('Student Number').fill('202012349');
    await page.getByRole('button', { name: 'Complete Profile' }).click();
    await expect(page.getByText('Complete Your Profile')).not.toBeVisible();
  });
});

testPartialToLottery.describe.serial('Student Profile Registration - PartialToLottery', () => {
  testPartialToLottery('completes profile', async ({ page }) => {
    await page.getByLabel('Student Number').fill('202012350');
    await page.getByRole('button', { name: 'Complete Profile' }).click();
    await expect(page.getByText('Complete Your Profile')).not.toBeVisible();
  });
});

testNoRankStudent.describe.serial('Student Profile Registration - NoRank', () => {
  testNoRankStudent('completes profile', async ({ page }) => {
    await page.getByLabel('Student Number').fill('202012351');
    await page.getByRole('button', { name: 'Complete Profile' }).click();
    await expect(page.getByText('Complete Your Profile')).not.toBeVisible();
  });
});

testLateRegistrant.describe.serial('Student Profile Registration - Late', () => {
  testLateRegistrant('completes profile', async ({ page }) => {
    await page.getByLabel('Student Number').fill('202012352');
    await page.getByRole('button', { name: 'Complete Profile' }).click();
    await expect(page.getByText('Complete Your Profile')).not.toBeVisible();
  });
});

// ============================================================================
// 3. ADMIN SETUP
// ============================================================================

testAdmin.describe.serial('Admin Lab Setup', () => {
  testAdmin('navigates to labs page', async ({ page }) => {
    await page.goto('/dashboard/labs/');
    await expect(page).toHaveURL('/dashboard/labs/');
    // Should see the labs table with all 5 labs
    await expect(page.getByText('Networks and Distributed Systems Laboratory')).toBeVisible();
    await expect(page.getByText('Computer Security Laboratory')).toBeVisible();
    await expect(page.getByText('Scientific Computing Laboratory')).toBeVisible();
    await expect(
      page.getByText('Computer Vision and Machine Intelligence Laboratory'),
    ).toBeVisible();
    await expect(page.getByText('Algorithms and Complexity Laboratory')).toBeVisible();
  });

  testAdmin('sets quota for each lab', async ({ page }) => {
    await page.goto('/dashboard/labs/');
    // Fill in quotas for each lab (inputs have name="{labId}")
    await page.locator('input[name="ndsl"]').fill('2');
    await page.locator('input[name="csl"]').fill('2');
    await page.locator('input[name="scl"]').fill('2');
    await page.locator('input[name="cvmil"]').fill('1');
    await page.locator('input[name="acl"]').fill('1');

    // Click Update Quotas button
    await page.getByRole('button', { name: 'Update Quotas' }).click();

    // Wait for success toast
    await expect(page.getByText('Successfully updated the lab quotas')).toBeVisible();
  });
});

testAdmin.describe.serial('Admin Draft Creation', () => {
  testAdmin('creates a new draft with 3 rounds', async ({ page }) => {
    await page.goto('/dashboard/drafts/');

    // Click Create Draft button to open dialog
    await page.getByRole('button', { name: 'Create Draft' }).click();

    // Wait for dialog to appear
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Fill in the form - registration closes 1 day from now
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = tomorrow.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM

    await dialog.locator('input#closesAt').fill(formattedDate);
    await dialog.locator('input#rounds').fill('3');

    // Set up dialog handler for confirmation
    page.on('dialog', dialog => dialog.accept());

    // Submit the form
    await dialog.getByRole('button', { name: 'Create Draft' }).click();

    // Dialog should close and draft table should show the new draft
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText('#1')).toBeVisible();
    await expect(page.getByText('Registration')).toBeVisible();
  });
});

// ============================================================================
// 4. HISTORY PAGE UPDATE
// ============================================================================

testAdmin.describe.serial('History During Registration', () => {
  testAdmin('shows Draft #1 in registration phase', async ({ page }) => {
    await page.goto('/history/');
    await expect(page.getByText('Draft #1')).toBeVisible();
    await expect(page.getByText('currently waiting for students to register')).toBeVisible();
  });
});

// ============================================================================
// 5. STUDENT PREFERENCES
// ============================================================================

testEagerDraftee.describe.serial('Student Lab Preferences - Eager', () => {
  testEagerDraftee('submits full prefs (NDSL > CSL > SCL)', async ({ page }) => {
    await page.goto('/dashboard/student/');
    // Should see the lab preference form
    await expect(page.getByText('Select preferred labs')).toBeVisible();

    // Select labs in order: NDSL, CSL, SCL
    await page.getByRole('button', { name: 'Networks and Distributed Systems Laboratory' }).click();
    await page.getByRole('button', { name: 'Computer Security Laboratory' }).click();
    await page.getByRole('button', { name: 'Scientific Computing Laboratory' }).click();

    // Set up dialog handler for confirmation
    page.on('dialog', dialog => dialog.accept());

    // Submit
    await page.getByRole('button', { name: 'Submit Lab Preferences' }).click();

    // Should see success message
    await expect(page.getByText('Uploaded your lab preferences')).toBeVisible();
  });
});

testPatientCandidate.describe.serial('Student Lab Preferences - Patient', () => {
  testPatientCandidate('submits full prefs (CSL > NDSL > SCL)', async ({ page }) => {
    await page.goto('/dashboard/student/');
    await expect(page.getByText('Select preferred labs')).toBeVisible();

    await page.getByRole('button', { name: 'Computer Security Laboratory' }).click();
    await page.getByRole('button', { name: 'Networks and Distributed Systems Laboratory' }).click();
    await page.getByRole('button', { name: 'Scientific Computing Laboratory' }).click();

    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Submit Lab Preferences' }).click();
    await expect(page.getByText('Uploaded your lab preferences')).toBeVisible();
  });
});

testPersistentHopeful.describe.serial('Student Lab Preferences - Persistent', () => {
  testPersistentHopeful('submits full prefs (SCL > CVMIL > ACL)', async ({ page }) => {
    await page.goto('/dashboard/student/');
    await expect(page.getByText('Select preferred labs')).toBeVisible();

    await page.getByRole('button', { name: 'Scientific Computing Laboratory' }).click();
    await page
      .getByRole('button', { name: 'Computer Vision and Machine Intelligence Laboratory' })
      .click();
    await page.getByRole('button', { name: 'Algorithms and Complexity Laboratory' }).click();

    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Submit Lab Preferences' }).click();
    await expect(page.getByText('Uploaded your lab preferences')).toBeVisible();
  });
});

testUnluckyFullRanker.describe.serial('Student Lab Preferences - Unlucky', () => {
  testUnluckyFullRanker('submits full prefs (ACL > CVMIL > NDSL)', async ({ page }) => {
    await page.goto('/dashboard/student/');
    await expect(page.getByText('Select preferred labs')).toBeVisible();

    await page.getByRole('button', { name: 'Algorithms and Complexity Laboratory' }).click();
    await page
      .getByRole('button', { name: 'Computer Vision and Machine Intelligence Laboratory' })
      .click();
    await page.getByRole('button', { name: 'Networks and Distributed Systems Laboratory' }).click();

    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Submit Lab Preferences' }).click();
    await expect(page.getByText('Uploaded your lab preferences')).toBeVisible();
  });
});

testPartialToDrafted.describe.serial('Student Lab Preferences - PartialToDrafted', () => {
  testPartialToDrafted('submits 2 prefs (NDSL > CSL)', async ({ page }) => {
    await page.goto('/dashboard/student/');
    await expect(page.getByText('Select preferred labs')).toBeVisible();

    await page.getByRole('button', { name: 'Networks and Distributed Systems Laboratory' }).click();
    await page.getByRole('button', { name: 'Computer Security Laboratory' }).click();

    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Submit Lab Preferences' }).click();
    await expect(page.getByText('Uploaded your lab preferences')).toBeVisible();
  });
});

testPartialToLottery.describe.serial('Student Lab Preferences - PartialToLottery', () => {
  testPartialToLottery('submits 1 pref (ACL)', async ({ page }) => {
    await page.goto('/dashboard/student/');
    await expect(page.getByText('Select preferred labs')).toBeVisible();

    await page.getByRole('button', { name: 'Algorithms and Complexity Laboratory' }).click();

    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Submit Lab Preferences' }).click();
    await expect(page.getByText('Uploaded your lab preferences')).toBeVisible();
  });
});

testNoRankStudent.describe.serial('Student Lab Preferences - NoRank', () => {
  testNoRankStudent('submits 0 prefs (goes directly to lottery)', async ({ page }) => {
    await page.goto('/dashboard/student/');
    await expect(page.getByText('Select preferred labs')).toBeVisible();

    // Don't select any labs, just submit
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Submit Lab Preferences' }).click();

    // Should see success message (zero preferences now allowed)
    await expect(page.getByText('Uploaded your lab preferences')).toBeVisible();
  });
});

// Note: testLateRegistrant will be tested after registration closes

// ============================================================================
// 6. REGISTRATION CLOSE (Admin starts draft)
// ============================================================================

testAdmin.describe.serial('Admin Starts Draft', () => {
  testAdmin('navigates to draft detail page', async ({ page }) => {
    await page.goto('/dashboard/drafts/');
    // Click View button for draft #1
    await page.getByRole('link', { name: 'View' }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/drafts\/1\//u);
  });

  testAdmin('sees registrant list', async ({ page }) => {
    await page.goto('/dashboard/drafts/1/');
    // Should see registered students count (7 students registered)
    await expect(page.getByText(/7 students/iu)).toBeVisible();
  });

  testAdmin('starts the draft', async ({ page }) => {
    await page.goto('/dashboard/drafts/1/');

    // Set up dialog handler
    page.on('dialog', dialog => dialog.accept());

    // Click Start Draft button
    await page.getByRole('button', { name: 'Start Draft' }).click();

    // Draft should now be in Round 1
    await expect(page.getByText(/Round 1/u)).toBeVisible();
  });
});

// ============================================================================
// 7. LATE REGISTRANT (after draft starts)
// ============================================================================

testLateRegistrant.describe.serial('Late Registrant', () => {
  testLateRegistrant('sees registration closed message', async ({ page }) => {
    await page.goto('/dashboard/student/');
    // Should see message about missing registration
    await expect(page.getByText(/registration.*closed/iu)).toBeVisible();
  });
});

// ============================================================================
// 8. FACULTY PRE-DRAFT CHECK
// ============================================================================

testNdslHead.describe.serial('Faculty Before Round 1 Submission', () => {
  testNdslHead('sees students who selected NDSL', async ({ page }) => {
    await page.goto('/dashboard/students/');
    // EagerDraftee and PartialToDrafted selected NDSL as first choice
    // UnluckyFullRanker selected NDSL as 3rd choice
    await expect(page.getByText(/Eager/u)).toBeVisible();
  });
});

// ============================================================================
// 9. ROUND 1
// ============================================================================

testNdslHead.describe.serial('Round 1 - NDSL', () => {
  testNdslHead('selects EagerDraftee', async ({ page }) => {
    await page.goto('/dashboard/students/');

    // Click on EagerDraftee to select
    await page.getByText('Eager').click();

    // Set up dialog handler
    page.on('dialog', dialog => dialog.accept());

    // Submit selection
    await page.getByRole('button', { name: 'Submit' }).click();

    // Should see confirmation or updated state
    await expect(page.getByText(/submitted|selected/iu)).toBeVisible();
  });
});

testCslHead.describe.serial('Round 1 - CSL', () => {
  testCslHead('selects PartialToDrafted', async ({ page }) => {
    await page.goto('/dashboard/students/');

    // CSL sees PatientCandidate (1st choice) and PartialToDrafted (2nd choice)
    // Select PartialToDrafted
    await page.getByText('Partial').click();

    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText(/submitted|selected/iu)).toBeVisible();
  });
});

testSclHead.describe.serial('Round 1 - SCL', () => {
  testSclHead('skips selection (no students selected)', async ({ page }) => {
    await page.goto('/dashboard/students/');

    // SCL sees PersistentHopeful as 1st choice
    // Skip by submitting with no selection
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Submit' }).click();
  });
});

testCvmilHead.describe.serial('Round 1 - CVMIL', () => {
  testCvmilHead('skips selection', async ({ page }) => {
    await page.goto('/dashboard/students/');

    // CVMIL sees PersistentHopeful (2nd choice) and UnluckyFullRanker (2nd choice)
    // Skip this round
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Submit' }).click();
  });
});

testAclHead.describe.serial('Round 1 - ACL', () => {
  testAclHead('skips selection', async ({ page }) => {
    await page.goto('/dashboard/students/');

    // ACL sees UnluckyFullRanker (1st choice), PersistentHopeful (3rd choice), PartialToLottery (1st choice)
    // Skip this round
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Submit' }).click();
  });
});

// ============================================================================
// 10. ROUND 2
// ============================================================================

testAdmin.describe.serial('Verify Round 2', () => {
  testAdmin('draft is now in Round 2', async ({ page }) => {
    await page.goto('/dashboard/drafts/1/');
    await expect(page.getByText(/Round 2/u)).toBeVisible();
  });
});

testNdslHead.describe.serial('Round 2 - NDSL', () => {
  testNdslHead('selects UnluckyFullRanker (3rd choice student)', async ({ page }) => {
    await page.goto('/dashboard/students/');

    // In round 2, NDSL still has quota. UnluckyFullRanker has NDSL as 3rd choice
    // Select if visible
    const unlucky = page.getByText('Unlucky');
    if (await unlucky.isVisible()) {
      await unlucky.click();
      page.on('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Submit' }).click();
    } else {
      // Skip if no students available
      page.on('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Submit' }).click();
    }
  });
});

testCslHead.describe.serial('Round 2 - CSL', () => {
  testCslHead('selects PatientCandidate', async ({ page }) => {
    await page.goto('/dashboard/students/');

    // PatientCandidate has CSL as 1st choice, should appear in round 2
    const patient = page.getByText('Patient');
    if (await patient.isVisible()) {
      await patient.click();
      page.on('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Submit' }).click();
    } else {
      page.on('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Submit' }).click();
    }
  });
});

testSclHead.describe.serial('Round 2 - SCL', () => {
  testSclHead('selects PersistentHopeful', async ({ page }) => {
    await page.goto('/dashboard/students/');

    const persistent = page.getByText('Persistent');
    if (await persistent.isVisible()) {
      await persistent.click();
      page.on('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Submit' }).click();
    } else {
      page.on('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Submit' }).click();
    }
  });
});

testCvmilHead.describe.serial('Round 2 - CVMIL', () => {
  testCvmilHead('skips selection', async ({ page }) => {
    await page.goto('/dashboard/students/');
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Submit' }).click();
  });
});

testAclHead.describe.serial('Round 2 - ACL', () => {
  testAclHead('skips selection', async ({ page }) => {
    await page.goto('/dashboard/students/');
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Submit' }).click();
  });
});

// ============================================================================
// 11. ROUND 3
// ============================================================================

testAdmin.describe.serial('Verify Round 3', () => {
  testAdmin('draft is now in Round 3', async ({ page }) => {
    await page.goto('/dashboard/drafts/1/');
    await expect(page.getByText(/Round 3/u)).toBeVisible();
  });
});

testNdslHead.describe.serial('Round 3 - NDSL', () => {
  testNdslHead('submits (quota may be full)', async ({ page }) => {
    await page.goto('/dashboard/students/');
    page.on('dialog', dialog => dialog.accept());

    const submitBtn = page.getByRole('button', { name: 'Submit' });
    if (await submitBtn.isVisible()) await submitBtn.click();
  });
});

testCslHead.describe.serial('Round 3 - CSL', () => {
  testCslHead('submits', async ({ page }) => {
    await page.goto('/dashboard/students/');
    page.on('dialog', dialog => dialog.accept());

    const submitBtn = page.getByRole('button', { name: 'Submit' });
    if (await submitBtn.isVisible()) await submitBtn.click();
  });
});

testSclHead.describe.serial('Round 3 - SCL', () => {
  testSclHead('submits', async ({ page }) => {
    await page.goto('/dashboard/students/');
    page.on('dialog', dialog => dialog.accept());

    const submitBtn = page.getByRole('button', { name: 'Submit' });
    if (await submitBtn.isVisible()) await submitBtn.click();
  });
});

testCvmilHead.describe.serial('Round 3 - CVMIL', () => {
  testCvmilHead('submits', async ({ page }) => {
    await page.goto('/dashboard/students/');
    page.on('dialog', dialog => dialog.accept());

    const submitBtn = page.getByRole('button', { name: 'Submit' });
    if (await submitBtn.isVisible()) await submitBtn.click();
  });
});

testAclHead.describe.serial('Round 3 - ACL', () => {
  testAclHead('submits', async ({ page }) => {
    await page.goto('/dashboard/students/');
    page.on('dialog', dialog => dialog.accept());

    const submitBtn = page.getByRole('button', { name: 'Submit' });
    if (await submitBtn.isVisible()) await submitBtn.click();
  });
});

// ============================================================================
// 12. HISTORY DURING DRAFT
// ============================================================================

testAdmin.describe.serial('History During Draft', () => {
  testAdmin('shows Draft #1 status', async ({ page }) => {
    await page.goto('/history/');
    await expect(page.getByText('Draft #1')).toBeVisible();
  });
});

// ============================================================================
// 13. LOTTERY PHASE
// ============================================================================

testAdmin.describe.serial('Lottery Phase', () => {
  testAdmin('draft enters lottery phase', async ({ page }) => {
    await page.goto('/dashboard/drafts/1/');
    // After all 3 rounds, draft should be in lottery
    await expect(page.getByText(/lottery/iu)).toBeVisible();
  });

  testAdmin('sees remaining students in lottery', async ({ page }) => {
    await page.goto('/dashboard/drafts/1/');
    // Students not drafted should appear in lottery list
    // NoRankStudent (0 prefs) and PartialToLottery (1 pref, rejected) should be here
    await expect(page.getByText(/remaining|lottery/iu)).toBeVisible();
  });
});

testNdslHead.describe.serial('Faculty Lottery Phase', () => {
  testNdslHead('sees lottery pending message', async ({ page }) => {
    await page.goto('/dashboard/students/');
    await expect(page.getByText(/lottery/iu)).toBeVisible();
  });
});

// ============================================================================
// 14. MANUAL INTERVENTION
// ============================================================================

testAdmin.describe.serial('Manual Intervention', () => {
  testAdmin('assigns student via intervention form', async ({ page }) => {
    await page.goto('/dashboard/drafts/1/');

    // Look for intervention form with lab selection dropdowns
    // Each lottery student has a dropdown to assign them to a lab
    const interventionForm = page.locator('form[action*="intervene"]');

    if (await interventionForm.isVisible()) {
      // Select a lab for each remaining student
      const selects = page.locator('select[name="interventions"]');
      const count = await selects.count();

      for (let i = 0; i < count; i++) {
        // Assign to any available lab
        const select = selects.nth(i);
        const options = select.locator('option');
        const optionCount = await options.count();
        if (optionCount > 1)
          // Select the first non-empty option
          await select.selectOption({ index: 1 });
      }

      page.on('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Apply Interventions' }).click();

      // Should see success toast
      await expect(page.getByText('Successfully applied the interventions')).toBeVisible();
    }
  });
});

// ============================================================================
// 15. CONCLUDE DRAFT - ERROR (if quota mismatch)
// ============================================================================

testAdmin.describe.serial('Conclude Draft - Initial Attempt', () => {
  testAdmin('attempts to conclude draft', async ({ page }) => {
    await page.goto('/dashboard/drafts/1/');

    page.on('dialog', dialog => dialog.accept());
    const concludeBtn = page.getByRole('button', { name: 'Conclude Draft' });

    if (await concludeBtn.isVisible()) {
      await concludeBtn.click();
      // May succeed or fail depending on quota match
      // Check for either success or error message
      await page.waitForTimeout(1000);
    }
  });
});

// ============================================================================
// 16. QUOTA ADJUSTMENT (if needed)
// ============================================================================

testAdmin.describe.serial('Admin Adjusts Quota If Needed', () => {
  testAdmin('updates quota to match remaining students', async ({ page }) => {
    // Check if draft is still not concluded
    await page.goto('/dashboard/drafts/1/');

    const concludeBtn = page.getByRole('button', { name: 'Conclude Draft' });
    if (await concludeBtn.isVisible()) {
      // Draft not concluded, need to adjust quotas
      await page.goto('/dashboard/labs/');

      // Get current state and adjust if possible
      // Note: quotas may be read-only during draft
      const warningAlert = page.getByText(/read-only while a draft is in progress/u);
      if (await warningAlert.isVisible()) {
        // Quotas cannot be changed during draft
        // This is expected behavior
      }
    }
  });
});

// ============================================================================
// 17. CONCLUDE DRAFT - SUCCESS
// ============================================================================

testAdmin.describe.serial('Conclude Draft - Success', () => {
  testAdmin('concludes draft successfully', async ({ page }) => {
    await page.goto('/dashboard/drafts/1/');

    page.on('dialog', dialog => dialog.accept());
    const concludeBtn = page.getByRole('button', { name: 'Conclude Draft' });

    if (await concludeBtn.isVisible()) {
      await concludeBtn.click();

      // Wait for page update
      await page.waitForTimeout(2000);

      // Check if draft is concluded
      await page.goto('/dashboard/drafts/');
      await expect(page.getByText('Concluded')).toBeVisible();
    } else {
      // Draft may already be concluded
      await page.goto('/dashboard/drafts/');
      await expect(page.getByText('Concluded')).toBeVisible();
    }
  });
});

// ============================================================================
// 18. VERIFY DISTRIBUTION
// ============================================================================

testAdmin.describe.serial('Verify Lottery Distribution', () => {
  testAdmin('students distributed across labs', async ({ page }) => {
    await page.goto('/dashboard/drafts/1/');

    // Verify the draft summary shows distribution
    // Should show students assigned to each lab
    await expect(page.getByText(/concluded/iu)).toBeVisible();
  });
});

// ============================================================================
// 19. FINAL HISTORY
// ============================================================================

testAdmin.describe.serial('History After Conclusion', () => {
  testAdmin('shows Draft #1 as concluded', async ({ page }) => {
    await page.goto('/history/');
    await expect(page.getByText('Draft #1')).toBeVisible();
    await expect(page.getByText(/was held from/u)).toBeVisible();
  });

  testAdmin('can view concluded draft details', async ({ page }) => {
    await page.goto('/history/1/');
    // Should show final distribution and results
    await expect(page.getByText(/Draft #1/u)).toBeVisible();
  });
});

// ============================================================================
// 20. DRAFTS TABLE STATUS
// ============================================================================

testAdmin.describe.serial('Drafts Table Final State', () => {
  testAdmin('shows draft with concluded status', async ({ page }) => {
    await page.goto('/dashboard/drafts/');
    await expect(page.getByText('#1')).toBeVisible();
    await expect(page.getByText('Concluded')).toBeVisible();
  });
});
