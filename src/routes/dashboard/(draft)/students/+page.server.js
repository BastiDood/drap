import { error, redirect } from '@sveltejs/kit';
import assert from 'node:assert/strict';
import { validateString } from '$lib/forms';

export async function load({ locals: { db, session }, parent }) {
  if (typeof session?.user === 'undefined') redirect(307, '/oauth/login/');

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId === null) error(403);

  const { draft } = await parent();
  const { lab, students, researchers, isDone } =
    await db.getLabAndRemainingStudentsInDraftWithLabPreference(draft.id, user.labId);
  if (typeof lab === 'undefined') error(404);

  return { draft, lab, students, researchers, isDone };
}

export const actions = {
  async rankings({ locals: { db, session }, request }) {
    if (typeof session?.user === 'undefined') error(401);

    const { user } = session;
    if (!user.isAdmin || user.googleUserId === null || user.labId === null) error(403);

    const data = await request.formData();
    const draft = BigInt(validateString(data.get('draft')));
    const students = data.getAll('students').map(validateString);

    const { quota, selected } = await db.getLabQuotaAndSelectedStudentCountInDraft(
      draft,
      user.labId,
    );
    assert(typeof quota !== 'undefined');

    const total = selected + students.length;
    if (total > quota) error(403);

    const lab = user.labId;
    const faculty = user.id;
    await db.begin(async db => {
      await db.insertFacultyChoice(draft, lab, faculty, students);

      // TODO: Reinstate notifications channel.
      // const postDraftRoundSubmittedNotification = await db.postDraftRoundSubmittedNotification(draft, lab);
      // db.logger.info({ postDraftRoundSubmittedNotification });

      while (true) {
        const count = await db.getPendingLabCountInDraft(draft);
        if (count > 0) break;

        const incrementDraftRound = await db.incrementDraftRound(draft);
        db.logger.info({ incrementDraftRound });
        assert(
          typeof incrementDraftRound !== 'undefined',
          'The draft to be incremented does not exist.',
        );

        // TODO: Reinstate notifications channel.
        // const postDraftRoundStartedNotification = await db.postDraftRoundStartedNotification(
        //     draft,
        //     incrementDraftRound.curr_round,
        // );
        // db.logger.info({ postDraftRoundStartedNotification });

        if (incrementDraftRound.currRound === null) break;

        const autoAcknowledgeLabsWithoutPreferences =
          await db.autoAcknowledgeLabsWithoutPreferences(draft);
        db.logger.info({ autoAcknowledgeLabsWithoutPreferences });
      }

      // TODO: Do notification as final step to ensure consistency
      // await db.notifyDraftChannel();
    });
  },
};
