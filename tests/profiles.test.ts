import { expect } from '@playwright/test';

import { completeStudentProfile } from './actions/student';
import { test } from './fixtures/users';
test(
  'Student numbers are unique and a rejected profile can be corrected',
  { tag: '@profiles' },
  async ({ eagerDrafteePage, patientCandidatePage }) => {
    await test.step('Eager lands on /dashboard/student/', async () => {
      await expect(eagerDrafteePage).toHaveURL('/dashboard/student/');
    });
    await test.step('Eager completes profile with student number', async () => {
      await expect(eagerDrafteePage.getByText('Complete Your Profile')).toBeVisible();
      await completeStudentProfile(eagerDrafteePage, '202012345');
    });
    await test.step('Patient cannot reuse an existing student number', async () => {
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
    await test.step('Patient completes profile', async () => {
      await completeStudentProfile(patientCandidatePage, '202012346');
    });
  },
);
test('Persistent completes profile', { tag: '@profiles' }, async ({ persistentHopefulPage }) => {
  await test.step('Persistent completes profile', async () => {
    await completeStudentProfile(persistentHopefulPage, '202012347');
  });
});
test('Unlucky completes profile', { tag: '@profiles' }, async ({ unluckyFullRankerPage }) => {
  await test.step('Unlucky completes profile', async () => {
    await completeStudentProfile(unluckyFullRankerPage, '202012348');
  });
});
test(
  'PartialToDrafted completes profile',
  { tag: '@profiles' },
  async ({ partialToDraftedPage }) => {
    await test.step('PartialToDrafted completes profile', async () => {
      await completeStudentProfile(partialToDraftedPage, '202012349');
    });
  },
);
test(
  'PartialToLottery completes profile',
  { tag: '@profiles' },
  async ({ partialToLotteryPage }) => {
    await test.step('PartialToLottery completes profile', async () => {
      await completeStudentProfile(partialToLotteryPage, '202012350');
    });
  },
);
test('NoRank completes profile', { tag: '@profiles' }, async ({ noRankStudentPage }) => {
  await test.step('NoRank completes profile', async () => {
    await completeStudentProfile(noRankStudentPage, '202012351');
  });
});
test('Idle completes profile', { tag: '@profiles' }, async ({ idleBystanderPage }) => {
  await test.step('Idle completes profile', async () => {
    await completeStudentProfile(idleBystanderPage, '202012353');
  });
});
test('Late completes profile', { tag: '@profiles' }, async ({ lateRegistrantPage }) => {
  await test.step('Late completes profile', async () => {
    await completeStudentProfile(lateRegistrantPage, '202012352');
  });
});
