import { error } from '@sveltejs/kit';

import { db, getActiveDraft } from '$lib/server/database';
import { Logger } from '$lib/server/telemetry/logger';

const SERVICE_NAME = 'routes.dashboard.draft.layout';
const logger = Logger.byName(SERVICE_NAME);

export async function load() {
  const draft = await getActiveDraft(db);
  if (typeof draft === 'undefined') {
    logger.error('no active draft found');
    error(499);
  }

  logger.info('active draft found', {
    id: draft.id.toString(),
    currRound: draft.currRound,
    maxRounds: draft.maxRounds,
  });

  const requestedAt = new Date();

  return { draft, requestedAt };
}
