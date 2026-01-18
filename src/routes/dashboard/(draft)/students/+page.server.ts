import assert from 'node:assert/strict';

import { error, redirect } from '@sveltejs/kit';

import {
  autoAcknowledgeLabsWithoutPreferences,
  begin,
  db,
  getLabAndRemainingStudentsInDraftWithLabPreference,
  getLabQuotaAndSelectedStudentCountInDraft,
  getPendingLabCountInDraft,
  incrementDraftRound,
  insertFacultyChoice,
} from '$lib/server/database';
import {
  createDraftRoundStartedNotification,
  createDraftRoundSubmittedNotification,
  type Notification,
} from '$lib/server/models/notification';
import { dispatch } from '$lib/server/queue';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';
import { validateString } from '$lib/forms';

const SERVICE_NAME = 'routes.dashboard.draft.students';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ locals: { session }, parent }) {
  if (typeof session?.user === 'undefined') {
    logger.warn('attempt to access students page without session');
    redirect(307, '/oauth/login/');
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId === null) {
    logger.warn('insufficient permissions to access students page', {
      'auth.user.is_admin': user.isAdmin,
      'auth.user.google_id': user.googleUserId,
      'user.lab_id': user.labId,
    });
    error(403);
  }

  const { draft } = await parent();
  if (typeof draft === 'undefined') {
    logger.warn('no active draft found');
    error(404);
  }

  logger.debug('active draft found', {
    'draft.id': draft.id.toString(),
    'draft.round.current': draft.currRound,
    'draft.round.max': draft.maxRounds,
  });

  const { lab, students, researchers, isDone } =
    await getLabAndRemainingStudentsInDraftWithLabPreference(db, draft.id, user.labId);
  if (typeof lab === 'undefined') {
    logger.error('lab not found');
    error(404);
  }

  logger.debug('lab and students fetched', {
    'lab.name': lab.name,
    'student.count': students.length,
    'lab.researcher_count': researchers.length,
    'draft.is_done': isDone,
  });
  return { draft, lab, students, researchers, isDone };
}

export const actions = {
  async rankings({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.warn('attempt to submit rankings without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId === null) {
      logger.warn('insufficient permissions to submit rankings', {
        'auth.user.is_admin': user.isAdmin,
        'auth.user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    const lab = user.labId;
    const faculty = user.id;
    return await tracer.asyncSpan('action.rankings', async () => {
      logger.debug('submitting rankings on behalf of lab head', { lab, faculty });

      const data = await request.formData();
      const draftId = BigInt(validateString(data.get('draft')));
      logger.debug('draft submitted', { 'draft.id': draftId.toString() });

      const students = data.getAll('students').map(validateString);
      logger.debug('students submitted', { students });

      const { quota, selected } = await getLabQuotaAndSelectedStudentCountInDraft(db, draftId, lab);
      assert(typeof quota !== 'undefined');

      const total = selected + students.length;
      if (total > quota) {
        logger.warn('total students exceeds quota', {
          'student.total': total,
          'lab.quota': quota,
        });
        error(403);
      }

      logger.debug('total students still within quota', {
        'student.total': total,
        'lab.quota': quota,
      });

      const notifications = await begin(db, async db => {
        const notifications: Notification[] = [];

        const draft = await insertFacultyChoice(db, draftId, lab, faculty, students);
        if (typeof draft === 'undefined') {
          logger.error('draft must exist prior to faculty choice submission');
          error(404);
        }

        notifications.push(createDraftRoundSubmittedNotification(draftId, draft.currRound, lab));

        while (true) {
          const count = await getPendingLabCountInDraft(db, draftId);
          if (count > 0) {
            logger.debug('more pending labs found', { 'lab.pending_count': count });
            break;
          }

          const draftRound = await incrementDraftRound(db, draftId);
          assert(typeof draftRound !== 'undefined', 'The draft to be incremented does not exist.');
          logger.debug('draft round incremented', draftRound);

          notifications.push(createDraftRoundStartedNotification(draftId, draftRound.currRound));

          if (draftRound.currRound === null) {
            logger.info('lottery round reached');
            break;
          }

          await autoAcknowledgeLabsWithoutPreferences(db, draftId);
          logger.debug('labs without preferences auto-acknowledged');
        }

        return notifications;
      });

      await dispatch.bulkDispatchNotification(...notifications);
      logger.info('student rankings submitted');
    });
  },
};
