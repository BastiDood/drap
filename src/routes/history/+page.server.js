export async function load({ locals: { db } }) {
    return { drafts: await db.getDrafts() };
}
