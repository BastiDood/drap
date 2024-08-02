import { redirect } from '@sveltejs/kit';

export async function load({ parent }) {
    const { user } = await parent();
    if (typeof user === 'undefined') redirect(302, '/oauth/login/');
    return { user };
}
