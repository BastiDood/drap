import { AuthorizationCode, IdToken, TokenResponse } from '$lib/server/models/oauth';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { error, redirect } from '@sveltejs/kit';
import { ok, strictEqual } from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import GOOGLE from '$lib/server/env/google';
import { parse } from 'valibot';

const fetchJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

// eslint-disable-next-line func-style
export async function GET({ fetch, locals: { db }, cookies, url: { searchParams } }) {
    // TODO: check if the session already exists
    const sid = cookies.get('sid');
    if (!sid) redirect(301, '/auth/login');

    const state = searchParams.get('state');
    if (state === null) error(400);

    const hashedSessionId = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sid));
    if (Buffer.from(state, 'base64url').compare(Buffer.from(hashedSessionId)) !== 0) error(400);

    const code = searchParams.get('code');
    if (code === null) error(400);

    const body = new URLSearchParams({
        code: parse(AuthorizationCode, code),
        client_id: GOOGLE.OAUTH_CLIENT_ID,
        client_secret: GOOGLE.OAUTH_CLIENT_SECRET,
        redirect_uri: GOOGLE.OAUTH_REDIRECT_URI,
        grant_type: 'authorization_code',
    });

    const jwk = await fetchJwks();
    await db.begin(async db => {
        const pending = await db.deletePendingSession(sid);
        if (pending === null) redirect(301, '/auth/login');
        const { nonce, expiration } = pending;

        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        });

        // TODO: provide better status code
        ok(res.ok);

        const json = await res.json();
        const { id_token } = parse(TokenResponse, json);
        const { payload } = await jwtVerify(id_token, jwk, {
            issuer: 'https://accounts.google.com',
            audience: GOOGLE.OAUTH_CLIENT_ID,
        });

        const token = parse(IdToken, payload);
        ok(token.email_verified);
        strictEqual(Buffer.from(token.nonce, 'base64url').compare(nonce), 0);

        await db.upsertOpenIdUser(token.sub, token.email, token.given_name, token.family_name, token.picture);
        await db.insertValidSession(sid, token.sub, expiration);
    });

    redirect(301, '/dashboard');
}