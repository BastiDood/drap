import { error } from '@sveltejs/kit';

export async function load({ locals: { db }, parent }) {
  const { user } = await parent();
  if (user.googleUserId === null || user.labId === null) error(403);
  return await db.getLabMembers(user.labId);
}
