import { assertSingle } from '$lib/server/assert';
import * as schema from '$lib/server/database/schema';
import {
  createDraft,
  finalizeDraft,
  runLottery,
  startDraft,
  updateInitialQuota,
} from '$tests/actions/draft';
import { expectLabAssignmentMembers, submitFacultySelection } from '$tests/actions/faculty';
import { completeStudentProfile, submitLabPreferences } from '$tests/actions/student';
import { test } from '$tests/fixtures/users';
import { expect } from '@playwright/test';
import { addDays } from 'date-fns';
import { eq } from 'drizzle-orm';

test.describe('Repeated Assignment Regression', { tag: '@repeated-assignment' }, () => {
  test.describe.configure({ mode: 'serial' });

  test('assigns Repeat in consecutive drafts after the explicit membership precondition', async ({
    adminPage,
    ndslHeadPage,
    repeatDrafteePage,
    database,
    repeatDrafteeUserId,
  }) => {
    await test.step('complete Repeat profile and assign them in the fourth draft', async () => {
      await completeStudentProfile(repeatDrafteePage, '202112364');
      await createDraft(adminPage, { closesAt: addDays(new Date(), 1), rounds: 1 });
      await submitLabPreferences(repeatDrafteePage, {
        labs: ['Networks and Distributed Systems Laboratory'],
        photoConsent: 'none',
      });
      await updateInitialQuota(adminPage, '4', { cvmil: 0, ndsl: 1, scl: 0 });
      await startDraft(adminPage, '4');
      await ndslHeadPage.goto('/dashboard/students/');
      await ndslHeadPage.getByRole('button', { name: /Repeat/u }).click();
      await submitFacultySelection(ndslHeadPage, 'Submit Selection');
      await runLottery(adminPage, '4');
      await finalizeDraft(adminPage, '4');
    });
    await test.step('clear the current assignment as the regression precondition', async () => {
      const row = await database
        .update(schema.user)
        .set({ labId: null })
        .where(eq(schema.user.id, repeatDrafteeUserId))
        .returning({ id: schema.user.id })
        .then(assertSingle);
      expect(row.id).toBe(repeatDrafteeUserId);
    });
    await test.step('assign Repeat again in the fifth draft', async () => {
      await createDraft(adminPage, { closesAt: addDays(new Date(), 1), rounds: 1 });
      await submitLabPreferences(repeatDrafteePage, {
        labs: ['Networks and Distributed Systems Laboratory'],
        photoConsent: 'none',
      });
      await updateInitialQuota(adminPage, '5', { cvmil: 0, ndsl: 1, scl: 0 });
      await startDraft(adminPage, '5');
      await ndslHeadPage.goto('/dashboard/students/');
      await ndslHeadPage.getByRole('button', { name: /Repeat/u }).click();
      await submitFacultySelection(ndslHeadPage, 'Submit Selection');
      await runLottery(adminPage, '5');
      await finalizeDraft(adminPage, '5');
    });
    await test.step('show the fifth assignment without ambiguity', async () =>
      await expectLabAssignmentMembers(repeatDrafteePage, '5', [/Repeat/u]));
  });
});
