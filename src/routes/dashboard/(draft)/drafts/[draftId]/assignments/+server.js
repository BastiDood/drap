import { db } from '$lib/server/database';
import { getDraftAssignmentRecords } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';
import { error } from '@sveltejs/kit';
import * as devalue from 'devalue';

const SERVICE_NAME = 'routes.dashboard.admin.drafts.assignments';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function GET({ params, locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.fatal('attempt to fetch draft assignments without session');
    error(401);
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to fetch draft assignments', void 0, {
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

  return await tracer.asyncSpan('fetch-draft-assignments', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
      'draft.id': params.draftId,
    });

    const draftId = BigInt(params.draftId);
    const assignments = await getDraftAssignmentRecords(db, draftId);

    logger.debug('draft assignments fetched', {
      'draft.id': draftId.toString(),
      'drafted_students.count': assignments.length,
    });

    return new Response(devalue.stringify(assignments), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
}
