import { error } from '@sveltejs/kit';
import { validateBigInt } from '$lib/validators';

export async function load({ locals: { db }, params: { draft: id } }) {
  const did = validateBigInt(id);
  db.logger.info({ did }, 'fetching draft');

  if (did === null) {
    db.logger.error('invalid draft id');
    error(404, 'Invalid draft ID.');
  }

  const draft = await db.getDraftById(did);
  if (typeof draft === 'undefined') {
    db.logger.error('draft not found');
    error(404, 'Draft not found.');
  }

  db.logger.info(draft, 'draft fetched');

  const events = await db.getDraftEvents(did);
  db.logger.info({ eventCount: events.length }, 'draft events fetched');

  return { did, draft, events };
}
