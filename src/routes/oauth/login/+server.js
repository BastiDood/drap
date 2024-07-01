import { Buffer } from 'node:buffer';
import { OAUTH_SCOPE_STRING } from '$lib/server/models/oauth';
import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';

export async function GET({ locals: { db }, cookies }) {
    // TODO: Check if already logged in
    const { session_id, nonce, expiration } = await db.generatePendingSession();
    cookies.set('sid', session_id, { path: '/', httpOnly: true, sameSite: 'lax', expires: expiration });

    const hashedSessionId = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(session_id));
    const params = new URLSearchParams({
        state: Buffer.from(hashedSessionId).toString('base64url'),
        client_id: env.GOOGLE_OAUTH_CLIENT_ID,
        redirect_uri: env.GOOGLE_OAUTH_REDIRECT,
        nonce: Buffer.from(nonce).toString('base64url'),
        access_type: 'online',
        response_type: 'code',
        prompt: 'select_account',
        scope: OAUTH_SCOPE_STRING,
    });

    redirect(301, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
