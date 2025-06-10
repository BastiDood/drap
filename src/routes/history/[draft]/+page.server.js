import { error } from '@sveltejs/kit';

/** @param {string} text */
function validateBigInt(text) {
  try {
    return BigInt(text);
  } catch (err) {
    if (err instanceof SyntaxError) return null;
    throw err;
  }
}

export async function load({ locals: { db }, params: { draft: id } }) {
  const did = validateBigInt(id);
  if (did === null) error(404, 'Invalid draft ID.');

  const draft = await db.getDraftById(did);
  if (typeof draft === 'undefined') error(404, 'Draft not found.');

  const events = await db.getDraftEvents(did);
  return { did, draft, events };
}
