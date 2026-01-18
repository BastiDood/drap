import { error, redirect } from '@sveltejs/kit';

import { db, getDrafts, getLabMembers, getUserLabAssignmentDraftId } from '$lib/server/database';
import { Logger } from '$lib/server/telemetry/logger';

const SERVICE_NAME = 'routes.dashboard.lab';
const logger = Logger.byName(SERVICE_NAME);

export async function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.error('attempt to access lab page without session');
    redirect(307, '/oauth/login/');
  }

  if (session.user.googleUserId === null || session.user.labId === null) {
    logger.error('insufficient permissions to access lab page', void 0, {
      isAdmin: session.user.isAdmin,
      googleUserId: session.user.googleUserId,
      labId: session.user.labId,
    });
    error(403);
  }

  type LabInfo = Awaited<ReturnType<typeof getLabMembers>>;
  // eslint-disable-next-line @typescript-eslint/init-declarations
  let info: LabInfo;

  if (session.user.isAdmin) {
    info = await getLabMembers(db, session.user.labId);
  } else {
    const userLatestDraft = await getUserLabAssignmentDraftId(
      db,
      session.user.id,
      session.user.labId,
    );
    if (typeof userLatestDraft === 'undefined') {
      logger.error(
        "attempt to get draft id for student-user's assignment to this lab returned undefined",
        void 0,
        {
          userId: session.user.id,
          labId: session.user.labId,
        },
      );
      error(400);
    }
    const { draftId: userLatestDraftId } = userLatestDraft;
    info = await getLabMembers(db, session.user.labId, userLatestDraftId);
  }

  await getLabMembers(db, session.user.labId);
  logger.info('lab info fetched', {
    labName: info.lab,
    headCount: info.heads.length,
    memberCount: info.members.length,
  });

  const drafts = await getDrafts(db);
  return { ...info, drafts };
}
