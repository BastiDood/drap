import { error, redirect } from '@sveltejs/kit';

export async function load({ locals: { db, session } }) {
  if (typeof session?.user === 'undefined') {
    db.logger.error('attempt to access lab page without session');
    redirect(307, '/oauth/login/');
  }

  if (session.user.googleUserId === null || session.user.labId === null) {
    db.logger.error(
      {
        isAdmin: session.user.isAdmin,
        googleUserId: session.user.googleUserId,
        labId: session.user.labId,
      },
      'insufficient permissions to access lab page',
    );
    error(403);
  }

  let info;

  if (session.user.isAdmin) {
    info = await db.getLabMembers(session.user.labId);
  } else {
    const userLatestDraft = await db.getUserLabAssignmentDraftId(
      session.user.id,
      session.user.labId,
    );
    if (typeof userLatestDraft === 'undefined') {
      db.logger.error(
        {
          userId: session.user.id,
          labId: session.user.labId,
        },
        "attempt to get draft id for student-user's assignment to this lab returned undefined",
      );
      error(400);
    }
    const { draftId: userLatestDraftId } = userLatestDraft;
    info = await db.getLabMembers(session.user.labId, userLatestDraftId);
  }

  await db.getLabMembers(session.user.labId);
  db.logger.info(
    { labName: info.lab, headCount: info.heads.length, memberCount: info.members.length },
    'lab info fetched',
  );

  const drafts = await db.getDrafts();

  return { ...info, drafts };
}
