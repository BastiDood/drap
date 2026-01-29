import { error, redirect } from '@sveltejs/kit';

import { db, getDrafts, getLabMembers, getUserLabAssignmentDraftId } from '$lib/server/database';
import { Logger } from '$lib/server/telemetry/logger';

const SERVICE_NAME = 'routes.dashboard.lab';
const logger = Logger.byName(SERVICE_NAME);

export async function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.warn('attempt to access lab page without session');
    redirect(307, '/dashboard/oauth/login');
  }

  if (session.user.googleUserId === null || session.user.labId === null) {
    logger.warn('insufficient permissions to access lab page', {
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
      // This is a required check to ensure that the user can only see lab members of their own
      // draft class. Otherwise, every student can see all lab members, which poor privacy practice.
      logger.error('student without prior draft results attempted to access lab', void 0, {
        userId: session.user.id,
        labId: session.user.labId,
      });
      error(403);
    }
    const { draftId: userLatestDraftId } = userLatestDraft;
    info = await getLabMembers(db, session.user.labId, userLatestDraftId);
  }

  await getLabMembers(db, session.user.labId);
  logger.debug('lab info fetched', {
    labName: info.lab,
    headCount: info.heads.length,
    memberCount: info.members.length,
  });

  const drafts = await getDrafts(db);
  return { ...info, drafts };
}
