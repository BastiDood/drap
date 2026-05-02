import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { assertOptional } from '$lib/server/assert';
import { db } from '$lib/server/database';
import { getDraftAvatarObject } from '$lib/server/s3/draft-student-avatar';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.avatars.draft';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function GET({ params: { objectKey }, locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    // Image fetches should not cause a redirect, so we terminate here.
    logger.fatal('attempt to fetch draft avatar without session');
    error(401);
  }

  const { user } = session;
  return await tracer.asyncSpan('get-draft-avatar', async span => {
    span.setAttributes({
      'session.user.id': user.id,
      'draft.avatar.object_key': objectKey,
    });

    const userId = await getDraftAvatarObjectKey(objectKey);
    if (typeof userId === 'undefined') {
      logger.fatal('draft avatar not found');
      error(404);
    }

    if (!user.isAdmin && user.id !== userId) {
      logger.fatal('insufficient permissions to fetch draft avatar', void 0, {
        'session.user.is_admin': user.isAdmin,
        'session.user.id': user.id,
        'owner.user.id': userId,
      });
      error(403);
    }

    const object = await getDraftAvatarObject(objectKey);
    if (typeof object.Body === 'undefined') {
      logger.fatal('draft avatar object has no body');
      error(500);
    }

    const headers = new Headers({ 'Cache-Control': 'private, max-age=31536000, immutable' });
    if (typeof object.ContentType !== 'undefined') headers.set('Content-Type', object.ContentType);
    if (typeof object.ContentLength !== 'undefined')
      headers.set('Content-Length', object.ContentLength.toString());
    return new Response(object.Body.transformToWebStream(), { headers });
  });
}

async function getDraftAvatarObjectKey(objectKey: string) {
  return await tracer.asyncSpan('get-draft-avatar-object-key', async span => {
    span.setAttributes({ 'draft.avatar.object_key': objectKey });
    const row = await db
      .select({ userId: schema.studentRank.userId })
      .from(schema.studentRank)
      .where(eq(schema.studentRank.avatarObjectKey, objectKey))
      .then(assertOptional);
    return row?.userId;
  });
}
