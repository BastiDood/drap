import { error } from '@sveltejs/kit';

import { db, getDraftById, getDraftEvents } from '$lib/server/database';
import { Logger } from '$lib/server/telemetry/logger';
import { validateBigInt } from '$lib/validators';

const SERVICE_NAME = 'routes.history.draft';
const logger = Logger.byName(SERVICE_NAME);

export async function load({ params: { draft: id } }) {
  const did = validateBigInt(id);
  if (did === null) {
    logger.error('invalid draft id');
    error(404, 'Invalid draft ID.');
  }

  logger.info('fetching draft', { 'draft.id': did.toString() });

  const draft = await getDraftById(db, did);
  if (typeof draft === 'undefined') {
    logger.error('draft not found');
    error(404, 'Draft not found.');
  }

  logger.info('draft fetched', {
    'draft.round.current': draft.currRound,
    'draft.round.max': draft.maxRounds,
    'draft.registration.closes_at': draft.registrationClosesAt.toISOString(),
  });

  const events = await getDraftEvents(db, did);
  logger.info('draft events fetched', { 'draft.event_count': events.length });

  return { did, draft, events };
}
