import { error, redirect } from '@sveltejs/kit';

import { db } from '$lib/server/database';
import {
  getDrafts,
  getLabMembers,
  getUserLabAssignmentDraftId,
} from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.lab';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.error('attempt to access lab page without session');
    redirect(307, '/dashboard/oauth/login');
  }

  if (session.user.googleUserId === null || session.user.labId === null) {
    logger.error('insufficient permissions to access lab page', void 0, {
      isAdmin: session.user.isAdmin,
      googleUserId: session.user.googleUserId,
      labId: session.user.labId,
    });
    error(403);
  }

  const {
    id: sessionId,
    user: { id: userId, isAdmin, googleUserId, labId },
  } = session;

  return await tracer.asyncSpan('load-lab-page', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
      'session.user.is_admin': isAdmin,
    });
    if (labId !== null) span.setAttribute('session.user.lab_id', labId);
    if (googleUserId !== null) span.setAttribute('session.user.google_id', googleUserId);

    // eslint-disable-next-line @typescript-eslint/init-declarations
    let info: Awaited<ReturnType<typeof getLabMembers>>;
    if (isAdmin) {
      logger.debug('admin accessing the lab page');
      info = await getLabMembers(db, labId);
    } else {
      const userLatestDraft = await getUserLabAssignmentDraftId(db, userId, labId);
      if (typeof userLatestDraft === 'undefined') {
        // The assumption here is that the user was invited as a faculty member
        // (and thus has no prior draft results).
        logger.debug('faculty accessing the lab page');
        info = await getLabMembers(db, labId);
      } else {
        // If the user was invited to this lab via regular draft methods, they are treated as a
        // student/researcher of the lab. This is a required check to ensure that the user can only
        // see lab members of their own draft class. Otherwise, every student can see all lab members
        // of all time, which is poor data privacy hygiene.
        logger.debug('researcher accessing the lab page');
        info = await getLabMembers(db, labId, userLatestDraft.draftId);
      }
    }

    const drafts = await getDrafts(db);
    return { ...info, drafts };
  });
}
