import * as devalue from 'devalue';
import { error } from '@sveltejs/kit';

import { db } from '$lib/server/database';
import { getStudentsInDraftTaggedByLab } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

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
    });

    const draftId = BigInt(params.draftId);
    const draftees = await getStudentsInDraftTaggedByLab(db, draftId);

    logger.debug('draftees fetched', {
      'draft.id': draftId.toString(),
      'draftees.count': draftees.length,
    });

    return new Response(devalue.stringify(draftees), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
}
