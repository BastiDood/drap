import { error } from '@sveltejs/kit';

export async function load({ locals: { db } }) {
  const draft = await db.getActiveDraft();
  if (typeof draft === 'undefined') {
    db.logger.error('no active draft found');
    error(499);
  }
  db.logger.info(draft, 'active draft found');
  return { draft };
}
