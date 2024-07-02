import { redirect } from '@sveltejs/kit';

export async function load({ parent }) {
    const { user } = await parent();
    if (user === null) redirect(302, '/oauth/login/');
    if (user.is_admin || user.student_number !== null) redirect(302, '/dashboard/');
    return { user };
}
