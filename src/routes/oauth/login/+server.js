import { OAUTH_SCOPE_STRING, SENDER_SCOPE_STRING } from '$lib/server/models/oauth';
import { Buffer } from 'node:buffer';
import GOOGLE from '$lib/server/env/google';
import { redirect } from '@sveltejs/kit';

export async function GET({ locals: { db }, cookies, url: { searchParams } }) {
    const sid = cookies.get('sid');
    const hasExtendedScope = Boolean(searchParams.get('extended'));
    if (typeof sid !== 'undefined') {
        const user = await db.getUserFromValidSession(sid);
        if (user !== null && !hasExtendedScope) redirect(302, '/');
    }

    const { session_id, nonce, expiration } = await db.generatePendingSession(hasExtendedScope);
    cookies.set('sid', session_id, { path: '/', httpOnly: true, sameSite: 'lax', expires: expiration });

    const hashedSessionId = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(session_id));
    const params = new URLSearchParams({
        state: Buffer.from(hashedSessionId).toString('base64url'),
        client_id: GOOGLE.OAUTH_CLIENT_ID,
        redirect_uri: GOOGLE.OAUTH_REDIRECT_URI,
        nonce: Buffer.from(nonce).toString('base64url'),
        hd: 'up.edu.ph',
        access_type: hasExtendedScope ? 'offline' : 'online',
        response_type: 'code',
        scope: hasExtendedScope ? SENDER_SCOPE_STRING : OAUTH_SCOPE_STRING,
        prompt: hasExtendedScope ? 'consent' : '',
    });

    redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
