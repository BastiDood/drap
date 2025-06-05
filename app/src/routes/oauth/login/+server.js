import * as GOOGLE from '$lib/server/env/google';
import { OAUTH_SCOPE_STRING, SENDER_SCOPE_STRING } from 'drap-model/oauth';
import { error, redirect } from '@sveltejs/kit';
import { Buffer } from 'node:buffer';

export async function GET({ locals: { db }, cookies, setHeaders, url: { searchParams } }) {
    setHeaders({ 'Cache-Control': 'no-store' });
    const sid = cookies.get('sid');
    const hasExtendedScope = searchParams.has('extended');
    if (typeof sid !== 'undefined') {
        // Allow only admins through extended scope flow
        const user = await db.getUserFromValidSession(sid);
        if (user !== null) {
            if (!hasExtendedScope) redirect(307, '/');
            if (user?.googleUserId === null || !user?.isAdmin || user.labId !== null) error(403);
        }
    }

    const { id: sessionId, nonce, expiration } = await db.generatePendingSession(hasExtendedScope);
    cookies.set('sid', sessionId, { path: '/', httpOnly: true, sameSite: 'lax', expires: expiration });

    // TODO: Use more secure CSRF token. Hash the entire session details instead of the public session ID.
    const hashedSessionId = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sessionId));
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

    redirect(307, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
