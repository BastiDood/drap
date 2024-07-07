import { redirect } from '@sveltejs/kit';

export async function load({ locals: { db } }) {
    // TODO: Check if the user previously voted.
    const id = await db.getLatestNewDraftId();
    if (id === null) return;
    redirect(302, `/dashboard/ranks/${id}/`);
}
