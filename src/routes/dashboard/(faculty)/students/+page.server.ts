import assert from 'node:assert/strict';

import * as v from 'valibot';
import { decode } from 'decode-formdata';
import { error, redirect } from '@sveltejs/kit';

import {
  autoAcknowledgeLabsWithoutPreferences,
  getFacultyAndStaff,
  getLabAndRemainingStudentsInDraftWithLabPreference,
  getLabById,
  getLabQuotaAndSelectedStudentCountInDraft,
  getPendingLabCountInDraft,
  getValidStaffEmails,
  incrementDraftRound,
  insertFacultyChoice,
} from '$lib/server/database/drizzle';
import { db } from '$lib/server/database';
import { inngest } from '$lib/server/inngest/client';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const RankingsFormData = v.object({
  draft: v.pipe(v.string(), v.minLength(1)),
  students: v.array(v.pipe(v.string(), v.minLength(1))),
});

const SERVICE_NAME = 'routes.dashboard.draft.students';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ locals: { session }, parent }) {
  if (typeof session?.user === 'undefined') {
    logger.error('attempt to access students page without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { id: sessionId, user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId === null) {
    logger.error('insufficient permissions to access students page', void 0, {
      'user.is_admin': user.isAdmin,
      'user.google_id': user.googleUserId,
      'user.lab_id': user.labId,
    });
    error(403);
  }

  const { id: userId, labId } = user;
  return await tracer.asyncSpan('load-students-page', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
    });
    if (labId !== null) span.setAttribute('session.user.lab_id', labId);

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
      await getLabAndRemainingStudentsInDraftWithLabPreference(db, draft.id, labId);
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
  });
}

export const actions = {
  async rankings({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.error('attempt to submit rankings without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId === null) {
      logger.error('insufficient permissions to submit rankings', void 0, {
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    const lab = user.labId;
    const faculty = user.id;
    return await tracer.asyncSpan('action.rankings', async () => {
      logger.debug('submitting rankings on behalf of lab head', { lab, faculty });

      const data = await request.formData();
      const { draft, students } = v.parse(RankingsFormData, decode(data, { arrays: ['students'] }));
      logger.debug('draft submitted', { 'draft.id': draft });
      logger.debug('students submitted', { students });

      const draftId = BigInt(draft);
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

      // Track data needed for notifications after transaction
      let submittedRound: number | null = null;
      const roundsToNotify: (number | null)[] = [];

      await db.transaction(
        async db => {
          const draft = await insertFacultyChoice(db, draftId, lab, faculty, students);
          if (typeof draft === 'undefined') {
            logger.error('draft must exist prior to faculty choice submission');
            error(404);
          }

          submittedRound = draft.currRound;

          while (true) {
            const count = await getPendingLabCountInDraft(db, draftId);
            if (count > 0) {
              logger.debug('more pending labs found', { 'lab.pending_count': count });
              break;
            }

            const draftRound = await incrementDraftRound(db, draftId);
            assert(
              typeof draftRound !== 'undefined',
              'The draft to be incremented does not exist.',
            );
            logger.debug('draft round incremented', draftRound);

            roundsToNotify.push(draftRound.currRound);

            if (draftRound.currRound === null) {
              logger.info('lottery round reached');
              break;
            }

            await autoAcknowledgeLabsWithoutPreferences(db, draftId);
            logger.debug('labs without preferences auto-acknowledged');
          }
        },
        { isolationLevel: 'repeatable read' },
      );

      // Dispatch notifications after successful transaction
      const [staffEmails, { name: labName }, facultyAndStaff] = await Promise.all([
        getValidStaffEmails(db),
        getLabById(db, lab),
        getFacultyAndStaff(db),
      ]);

      const roundSubmittedEvents = staffEmails.map(email => ({
        name: 'draft/round.submitted' as const,
        data: {
          draftId: Number(draftId),
          round: submittedRound,
          labId: lab,
          labName,
          recipientEmail: email,
        },
      }));

      const roundStartedEvents = roundsToNotify.flatMap(round =>
        facultyAndStaff.map(({ email, givenName, familyName }) => ({
          name: 'draft/round.started' as const,
          data: {
            draftId: Number(draftId),
            round,
            recipientEmail: email,
            recipientName: `${givenName} ${familyName}`,
          },
        })),
      );

      await inngest.send([...roundSubmittedEvents, ...roundStartedEvents]);
      logger.info('student rankings submitted');
    });
  },
};
