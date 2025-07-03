export async function load({ locals: { db } }) {
  const drafts = await db.getDrafts();
  db.logger.info({ draftCount: drafts.length }, 'drafts fetched');
  return { drafts };
}
