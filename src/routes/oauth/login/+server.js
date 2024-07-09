import { Buffer } from 'node:buffer';
import GOOGLE from '$lib/server/env/google';
import { OAUTH_SCOPE_STRING } from '$lib/server/models/oauth';
import { redirect } from '@sveltejs/kit';

export async function GET({ locals: { db }, cookies, url: { searchParams } }) {
    const sid = cookies.get('sid');
    if (typeof sid !== 'undefined') {
        const user = await db.getUserFromValidSession(sid);
        if (user !== null) redirect(302, '/');
    }

    const { session_id, nonce, expiration } = await db.generatePendingSession();
    cookies.set('sid', session_id, { path: '/', httpOnly: true, sameSite: 'lax', expires: expiration });

    const isNewSender = Boolean(searchParams.get('new_sender'))

    const hashedSessionId = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(session_id));
    const params = new URLSearchParams({
        state: Buffer.from(hashedSessionId).toString('base64url'),
        client_id: GOOGLE.OAUTH_CLIENT_ID,
        redirect_uri: GOOGLE.OAUTH_REDIRECT_URI,
        nonce: Buffer.from(nonce).toString('base64url'),
        hd: 'up.edu.ph',
        access_type: isNewSender ? 'offline' : 'online',
        response_type: 'code',
        scope: OAUTH_SCOPE_STRING.concat(isNewSender ? ' https://mail.google.com/' : '' ),
        prompt: isNewSender ? 'consent' : ''
    });

    redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
