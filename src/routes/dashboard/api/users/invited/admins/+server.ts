import { and, eq, isNull } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { db } from '$lib/server/database';
import type { DbConnection } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.api.users.invited.admins';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function GET({ locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.fatal('attempt to access invited admins without session');
    error(401);
  }

  if (!session.user.isAdmin || session.user.googleUserId === null || session.user.labId !== null) {
    logger.fatal('insufficient permissions to access invited admins', void 0, {
      'user.is_admin': session.user.isAdmin,
      'user.google_id': session.user.googleUserId,
      'user.lab_id': session.user.labId,
    });
    error(403);
  }

  const {
    id: sessionId,
    user: { id: userId },
  } = session;

  return await tracer.asyncSpan('fetch-invited-admins', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
    });
    const admins = await getInvitedAdmins(db);
    return json(admins);
  });
}

async function getInvitedAdmins(db: DbConnection) {
  return await tracer.asyncSpan(
    'get-invited-admins',
    async () =>
      await db
        .select({
          id: schema.user.id,
          email: schema.user.email,
          givenName: schema.user.givenName,
          familyName: schema.user.familyName,
          avatarUrl: schema.user.avatarUrl,
          labId: schema.lab.id,
          labName: schema.lab.name,
        })
        .from(schema.user)
        .leftJoin(schema.lab, eq(schema.user.labId, schema.lab.id))
        .where(
          and(
            eq(schema.user.isAdmin, true),
            isNull(schema.user.googleUserId),
            isNull(schema.user.labId),
          ),
        ),
  );
}
