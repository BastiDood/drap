export async function load({ locals: { db } }) {
  return {
    draft: await db.getActiveDraft(),
    requestedAt: new Date()
  };
}
