import { OAUTH_SCOPE_STRING, SENDER_SCOPE_STRING } from '$lib/server/models/oauth';
import { error, redirect } from '@sveltejs/kit';
import { Buffer } from 'node:buffer';
import GOOGLE from '$lib/server/env/google';

export async function GET({ locals: { db }, cookies, url: { searchParams } }) {
    const sid = cookies.get('sid');
    const hasExtendedScope = searchParams.has('extended');
    if (typeof sid !== 'undefined') {
        // Allow only admins through extended scope flow
        const user = await db.getUserFromValidSession(sid);
        if (user !== null) {
            if (!hasExtendedScope) redirect(302, '/');
            if (user.user_id === null || !user.is_admin || user.lab_id !== null) error(403);
        }
    }

    const { session_id, nonce, expiration } = await db.generatePendingSession(hasExtendedScope);
    cookies.set('sid', session_id, { path: '/', httpOnly: true, sameSite: 'lax', expires: expiration });

    // TODO: Use more secure CSRF token. Hash the entire session details instead of the public session ID.
    const hashedSessionId = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(session_id));
    const params = new URLSearchParams({
        state: Buffer.from(hashedSessionId).toString('base64url'),
        client_id: GOOGLE.OAUTH_CLIENT_ID,
        redirect_uri: GOOGLE.OAUTH_REDIRECT_URI,
        nonce: Buffer.from(nonce).toString('base64url'),
        hd: 'up.edu.ph',
        response_type: 'code',
    });

    if (hasExtendedScope) {
        params.set('access_type', 'offline');
        params.set('scope', SENDER_SCOPE_STRING);
        params.set('prompt', 'consent');
    } else {
        params.set('access_type', 'online');
        params.set('scope', OAUTH_SCOPE_STRING);
    }

    redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
