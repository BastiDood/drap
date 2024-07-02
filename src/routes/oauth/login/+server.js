import { Buffer } from 'node:buffer';
import GOOGLE from '$lib/server/env/google';
import { OAUTH_SCOPE_STRING } from '$lib/server/models/oauth';
import { redirect } from '@sveltejs/kit';

export async function GET({ locals: { db }, cookies }) {
    // TODO: Check if already logged in
    const { session_id, nonce, expiration } = await db.generatePendingSession();
    cookies.set('sid', session_id, { path: '/', httpOnly: true, sameSite: 'lax', expires: expiration });

    const hashedSessionId = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(session_id));
    const params = new URLSearchParams({
        state: Buffer.from(hashedSessionId).toString('base64url'),
        client_id: GOOGLE.OAUTH_CLIENT_ID,
        redirect_uri: GOOGLE.OAUTH_REDIRECT_URI,
        nonce: Buffer.from(nonce).toString('base64url'),
        hd: 'up.edu.ph',
        access_type: 'online',
        response_type: 'code',
        scope: OAUTH_SCOPE_STRING,
    });

    redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
