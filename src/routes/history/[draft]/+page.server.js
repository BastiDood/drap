import { error } from '@sveltejs/kit';

export async function load({ locals: { db }, params: { draft: id } }) {
    try {
        const draft = await db.getDraftById(BigInt(id));
        if (draft === null) error(404, 'Draft not found.');
        return { id, draft };
    } catch (err) {
        if (err instanceof SyntaxError) error(404, 'Invalid draft ID.');
        throw err;
    }
}
