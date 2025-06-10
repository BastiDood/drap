import { error } from '@sveltejs/kit';

export async function load({ locals: { db } }) {
  const draft = await db.getActiveDraft();
  if (typeof draft === 'undefined') error(499);
  return { draft };
}
