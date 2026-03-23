import assert from 'node:assert/strict';

import * as v from 'valibot';
import { decode } from 'decode-formdata';
import { error, fail, redirect } from '@sveltejs/kit';

import {
  autoAcknowledgeLabsWithoutPreferences,
  getActiveDraftForUpdate,
  getFacultyAndStaff,
  getFacultyChoiceForLabInDraftRound,
  getLabAndRemainingStudentsInDraftWithLabPreference,
  getLabById,
  getLabQuotaAndSelectedStudentCountInDraft,
  getLabSelectedStudentCountInDraftRound,
  getPendingLabCountInDraft,
  getValidStaffEmails,
  incrementDraftRound,
  upsertFacultyChoice,
} from '$lib/server/database/drizzle';
import { db } from '$lib/server/database';
import { inngest } from '$lib/server/inngest/client';
import { Logger } from '$lib/server/telemetry/logger';
import { RoundStartedEvent, RoundSubmittedEvent } from '$lib/server/inngest/schema';
import { Tracer } from '$lib/server/telemetry/tracer';

const RankingsFormData = v.object({
  draft: v.pipe(v.string(), v.minLength(1)),
  round: v.pipe(v.number(), v.integer(), v.minValue(1)),
  students: v.array(v.pipe(v.string(), v.minLength(1))),
});

const SERVICE_NAME = 'routes.dashboard.draft.students';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

function toRoundStartedPayload(round: number | null, maxRounds: number) {
  return round === null || round > maxRounds ? null : round;
}

export async function load({ locals: { session }, parent }) {
  if (typeof session?.user === 'undefined') {
    logger.warn('attempt to access students page without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { id: sessionId, user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId === null) {
    logger.fatal('insufficient permissions to access students page', void 0, {
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
      logger.fatal('no active draft found');
      error(404);
    }

    logger.debug('active draft found', {
      'draft.id': draft.id.toString(),
      'draft.round.current': draft.currRound,
      'draft.round.max': draft.maxRounds,
    });

    const draftLabResult = await getLabAndRemainingStudentsInDraftWithLabPreference(
      db,
      draft.id,
      labId,
    );
    if (typeof draftLabResult === 'undefined') {
      logger.warn('lab not in draft snapshot', { 'lab.id': labId });
      return { draft };
    }

    const { lab, students, researchers, submissionSource, remainingQuota, autoAcknowledgeReason } =
      draftLabResult;
    logger.debug('lab and students fetched', {
      'lab.name': lab.name,
      'student.count': students.length,
      'lab.researcher_count': researchers.length,
      'draft.round.submission_source': submissionSource,
      'draft.round.remaining_quota': remainingQuota,
      'draft.round.auto_acknowledge_reason': autoAcknowledgeReason,
    });

    return {
      draft,
      info: {
        lab,
        students,
        researchers,
        submissionSource,
        remainingQuota,
        autoAcknowledgeReason,
      },
    };
  });
}

export const actions = {
  async rankings({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to submit rankings without session');
      error(401);
    }

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId === null) {
      logger.fatal('insufficient permissions to submit rankings', void 0, {
        'user.is_admin': user.isAdmin,
        'user.google_id': user.googleUserId,
        'user.lab_id': user.labId,
      });
      error(403);
    }

    const lab = user.labId;
    const faculty = user.id;
    return await tracer.asyncSpan('action.rankings', async () => {
      logger.debug('submitting rankings on behalf of lab head', {
        'lab.id': lab,
        'user.id': faculty,
      });

      const data = await request.formData();
      const {
        draft,
        round: expectedRound,
        students,
      } = v.parse(RankingsFormData, decode(data, { arrays: ['students'], numbers: ['round'] }));
      logger.debug('rankings form received', {
        'draft.id': draft,
        'draft.round.expected': expectedRound,
        'student.ids': students,
      });

      const draftId = BigInt(draft);
      const transactionResult = await db.transaction(
        async db => {
          const activeDraft = await getActiveDraftForUpdate(db);
          if (typeof activeDraft === 'undefined' || activeDraft.id !== draftId) {
            logger.fatal('attempt to submit rankings for non-active draft', void 0, {
              'draft.id': draftId.toString(),
            });
            error(403);
          }

          if (
            activeDraft.currRound === null ||
            activeDraft.currRound <= 0 ||
            activeDraft.currRound > activeDraft.maxRounds
          ) {
            logger.fatal('attempt to submit rankings outside regular rounds', void 0, {
              'draft.id': draftId.toString(),
              'draft.round.current': activeDraft.currRound,
              'draft.round.max': activeDraft.maxRounds,
            });
            error(403);
          }

          if (activeDraft.currRound !== expectedRound) {
            logger.warn('round mismatch - round may have advanced since page load', {
              'draft.id': draftId.toString(),
              'draft.round.current': activeDraft.currRound,
              'draft.round.expected': expectedRound,
            });
            return fail(409, { reason: 'round_mismatch' });
          }

          const existingChoice = await getFacultyChoiceForLabInDraftRound(
            db,
            draftId,
            activeDraft.currRound,
            lab,
          );
          const { quota, selected } = await getLabQuotaAndSelectedStudentCountInDraft(
            db,
            draftId,
            lab,
          );
          assert(typeof quota !== 'undefined');

          let baseSelected = selected;
          if (typeof existingChoice !== 'undefined') {
            if (existingChoice.userId !== faculty) {
              logger.fatal('attempt to edit non-faculty or foreign submission', void 0, {
                'draft.id': draftId.toString(),
                'draft.round.current': activeDraft.currRound,
                'choice.user_id': existingChoice.userId,
                'user.id': faculty,
              });
              error(403);
            }

            if (existingChoice.round !== activeDraft.currRound) {
              logger.warn('attempt to edit submission after round advanced', {
                'draft.id': draftId.toString(),
                'draft.round.current': activeDraft.currRound,
                'choice.round': existingChoice.round,
              });
              return fail(409, { reason: 'round_advanced' });
            }

            const selectedInCurrentRound = await getLabSelectedStudentCountInDraftRound(
              db,
              draftId,
              lab,
              activeDraft.currRound,
            );
            baseSelected = selected - selectedInCurrentRound;
          }

          const total = baseSelected + students.length;
          if (total > quota) {
            logger.fatal('total students exceeds quota', void 0, {
              'student.total': total,
              'lab.quota': quota,
            });
            error(403);
          }

          logger.debug('total students still within quota', {
            'student.total': total,
            'lab.quota': quota,
          });

          const draft = await upsertFacultyChoice(db, draftId, lab, faculty, students);
          if (typeof draft === 'undefined') {
            logger.fatal('draft must exist prior to faculty choice submission');
            error(404);
          }

          const submittedRound = draft.currRound;
          assert(
            submittedRound !== null &&
              submittedRound > 0 &&
              submittedRound <= activeDraft.maxRounds,
            'cannot submit preferences outside regular rounds',
          );

          // Track data needed for notifications after transaction
          const roundsToNotify: (number | null)[] = [];
          while (true) {
            // Auto-acknowledge labs without preferences BEFORE checking pending count
            await autoAcknowledgeLabsWithoutPreferences(db, draftId);
            logger.debug('labs without preferences auto-acknowledged');

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

            roundsToNotify.push(toRoundStartedPayload(draftRound.currRound, draftRound.maxRounds));

            if (draftRound.currRound === null || draftRound.currRound > draftRound.maxRounds) {
              logger.info('intervention round reached');
              break;
            }
          }

          return { submittedRound, roundsToNotify };
        },
        { isolationLevel: 'read committed' },
      );

      // Early return if transaction returned a failure
      if ('status' in transactionResult) return transactionResult;

      const { submittedRound, roundsToNotify } = transactionResult;

      // Dispatch notifications after successful transaction
      const [staffEmails, { name: labName }, facultyAndStaff] = await Promise.all([
        getValidStaffEmails(db),
        getLabById(db, lab),
        getFacultyAndStaff(db),
      ]);

      const roundSubmittedEvents = staffEmails.map(email =>
        RoundSubmittedEvent.create({
          draftId: Number(draftId),
          round: submittedRound,
          labId: lab,
          labName,
          recipientEmail: email,
        }),
      );

      const roundStartedEvents = roundsToNotify.flatMap((round: number | null) =>
        facultyAndStaff.map(({ email, givenName, familyName }) =>
          RoundStartedEvent.create({
            draftId: Number(draftId),
            round,
            recipientEmail: email,
            recipientName: `${givenName} ${familyName}`,
          }),
        ),
      );

      await inngest.send([...roundSubmittedEvents, ...roundStartedEvents]);
      logger.info('student rankings submitted');
    });
  },
};
