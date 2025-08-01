import assert from 'node:assert/strict';

import { error, redirect } from '@sveltejs/kit';

import {
  createDraftRoundStartedNotification,
  createDraftRoundSubmittedNotification,
  type Notification,
} from '$lib/server/models/notification';
import { validateString } from '$lib/forms';

export async function load({ locals: { db, session }, parent }) {
  if (typeof session?.user === 'undefined') {
    db.logger.error('attempt to access students page without session');
    redirect(307, '/oauth/login/');
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId === null) {
    db.logger.error(
      { isAdmin: user.isAdmin, googleUserId: user.googleUserId, labId: user.labId },
      'insufficient permissions to access students page',
    );
    error(403);
  }

  const { draft } = await parent();
  if (typeof draft === 'undefined') {
    db.logger.error('no active draft found');
    error(404);
  }

  db.logger.info(draft, 'active draft found');

  const { lab, students, researchers, isDone } =
    await db.getLabAndRemainingStudentsInDraftWithLabPreference(draft.id, user.labId);
  if (typeof lab === 'undefined') {
    db.logger.error('lab not found');
    error(404);
  }

  db.logger.info({ lab, students, researchers, isDone }, 'lab and students fetched');
  return { draft, lab, students, researchers, isDone };
}

export const actions = {
  async rankings({ locals: { db, session, dispatch }, request }) {
    if (typeof session?.user === 'undefined') {
      db.logger.error('attempt to submit rankings without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId === null) {
      db.logger.error(
        { isAdmin: user.isAdmin, googleUserId: user.googleUserId, labId: user.labId },
        'insufficient permissions to submit rankings',
      );
      error(403);
    }

    const lab = user.labId;
    const faculty = user.id;
    db.logger.info({ lab, faculty }, 'submitting rankings on behalf of lab head');

    const data = await request.formData();
    const draftId = BigInt(validateString(data.get('draft')));
    db.logger.info({ draftId }, 'draft submitted');

    const students = data.getAll('students').map(validateString);
    db.logger.info({ students }, 'students submitted');

    const { quota, selected } = await db.getLabQuotaAndSelectedStudentCountInDraft(
      draftId,
      user.labId,
    );
    assert(typeof quota !== 'undefined');

    const total = selected + students.length;
    if (total > quota) {
      db.logger.error({ total, quota }, 'total students exceeds quota');
      error(403);
    }

    db.logger.info({ total, quota }, 'total students still within quota');

    const notifications = await db.begin(async db => {
      const notifications: Notification[] = [];

      const draft = await db.insertFacultyChoice(draftId, lab, faculty, students);
      if (typeof draft === 'undefined') {
        db.logger.error('draft must exist prior to faculty choice submission');
        error(404);
      }

      notifications.push(createDraftRoundSubmittedNotification(draftId, draft.currRound, lab));

      while (true) {
        const count = await db.getPendingLabCountInDraft(draftId);
        if (count > 0) {
          db.logger.info({ pendingLabCount: count }, 'more pending labs found');
          break;
        }

        const incrementDraftRound = await db.incrementDraftRound(draftId);
        assert(
          typeof incrementDraftRound !== 'undefined',
          'The draft to be incremented does not exist.',
        );
        db.logger.info(incrementDraftRound, 'draft round incremented');

        notifications.push(
          createDraftRoundStartedNotification(draftId, incrementDraftRound.currRound),
        );

        if (incrementDraftRound.currRound === null) {
          db.logger.info('lottery round reached');
          break;
        }

        await db.autoAcknowledgeLabsWithoutPreferences(draftId);
        db.logger.info('labs without preferences auto-acknowledged');
      }

      return notifications;
    });

    await dispatch.bulkDispatchNotification(...notifications);
    db.logger.info('student rankings submitted');
  },
};
