import { eq } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { db } from '$lib/server/database';
import type { DbConnection } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.admin.drafts.registration-timestamps';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function GET({ params, locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.fatal('attempt to fetch registration timestamps without session');
    error(401);
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to fetch registration timestamps', void 0, {
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

  return await tracer.asyncSpan('fetch-draft-registration-timestamps', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
      'draft.id': params.draftId,
    });

    const draftId = BigInt(params.draftId);
    const timestamps = await getRegistrationTimestampsByDraft(db, draftId);
    logger.debug('registration timestamps fetched', { 'result.count': timestamps.length });
    return json(timestamps);
  });
}

async function getRegistrationTimestampsByDraft(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-registration-timestamps-by-draft', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const rows = await db
      .select({ registeredAt: schema.studentRank.createdAt })
      .from(schema.studentRank)
      .where(eq(schema.studentRank.draftId, draftId))
      .orderBy(({ registeredAt }) => registeredAt);
    return rows.map(({ registeredAt }) => registeredAt.toISOString());
  });
}
