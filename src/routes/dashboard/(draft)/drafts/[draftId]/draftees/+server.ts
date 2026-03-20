import { error, json } from '@sveltejs/kit';

import { db } from '$lib/server/database';
import { getStudentsInDraftTaggedByLab } from '$lib/server/database/drizzle'
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';;
import type { SerializableStudent } from '$lib/features/drafts/types';

const SERVICE_NAME = 'routes.dashboard.admin.drafts.draftees';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function GET({ params, locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.fatal('attempt to fetch draftee list without session');
    error(401);
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.error('insufficient permissions to fetch draftee list', void 0, {
      'user.is_admin': user.isAdmin,
      'user.google_id': user.googleUserId,
      'user.lab_id': user.labId,
    });
    error(403);
  }

  const {
    id: sessionId,
    user: { id: userId },
  } = session;

  return await tracer.asyncSpan('fetch-draftee-list', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
      'draft.id': params.draftId,
    });

    const draftId = BigInt(params.draftId);

    const draftees = await getStudentsInDraftTaggedByLab(db, draftId);

    // Make data JSON-serializable
    const serializableDrafteeList = draftees.map(draftee => {
      return {
        ...draftee,

        // Reassign non-serializable attributes
        studentNumber: draftee.studentNumber === null ? null : draftee.studentNumber.toString(),
      };
    }) as SerializableStudent[];

    logger.debug('draftees fetched', {
      'draft.id': draftId.toString(),
      'draftee-list.length': serializableDrafteeList.length,
    });

    return json(serializableDrafteeList);
  });
}
