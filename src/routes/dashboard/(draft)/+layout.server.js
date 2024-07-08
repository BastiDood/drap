export async function load({ locals: { db } }) {
    return { draft: await db.getLatestDraft() };
}
