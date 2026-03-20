import * as devalue from 'devalue';
import { error } from '@sveltejs/kit';

import { db } from '$lib/server/database';
import { getAllowlistByDraft } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.admin.drafts.allowlist';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function GET({ params, locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.fatal('attempt to fetch allowlist without session');
    error(401);
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to fetch allowlist', void 0, {
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

  return await tracer.asyncSpan('fetch-draft-allowlist', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
      'draft.id': params.draftId,
    });

    const draftId = BigInt(params.draftId);
    const allowlist = await getAllowlistByDraft(db, draftId);

    logger.debug('allowlist fetched', {
      'draft.id': draftId.toString(),
      'allowlist.count': allowlist.length,
    });

    return new Response(devalue.stringify(allowlist), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
}
