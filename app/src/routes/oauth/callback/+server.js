import { AuthorizationCode, IdToken, TokenResponse } from 'drap-model/oauth';
import { error, redirect } from '@sveltejs/kit';
import { ok, strictEqual } from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import GOOGLE from '$lib/server/env/google';
import { fetchJwks } from 'drap-email/jwks';
import { jwtVerify } from 'jose';
import { parse } from 'valibot';

export async function GET({ fetch, locals: { db }, cookies, setHeaders, url: { searchParams } }) {
    setHeaders({ 'Cache-Control': 'no-store' });
    const sid = cookies.get('sid');
    if (typeof sid === 'undefined') redirect(307, '/oauth/login/');

    const code = searchParams.get('code');
    if (code === null) {
        cookies.delete('sid', { path: '/', httpOnly: true, sameSite: 'lax' });
        error(400, 'Authorization code is missing.');
    }

    const state = searchParams.get('state');
    if (state === null) {
        cookies.delete('sid', { path: '/', httpOnly: true, sameSite: 'lax' });
        error(400, 'State challenge is missing.');
    }

    const hashedSessionId = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sid));
    if (Buffer.from(state, 'base64url').compare(Buffer.from(hashedSessionId)) !== 0) {
        cookies.delete('sid', { path: '/', httpOnly: true, sameSite: 'lax' });
        error(
            400,
            'Session state mismatch detected. Please (1) refresh the page, (2) clear your browser cache cookies, or (3) log in again.',
        );
    }

    const body = new URLSearchParams({
        code: parse(AuthorizationCode, code),
        client_id: GOOGLE.OAUTH_CLIENT_ID,
        client_secret: GOOGLE.OAUTH_CLIENT_SECRET,
        redirect_uri: GOOGLE.OAUTH_REDIRECT_URI,
        grant_type: 'authorization_code',
    });

    const { hasExtendedScope, expires } = await db.begin(async db => {
        const pending = await db.deletePendingSession(sid);
        if (pending === null) redirect(307, '/oauth/login/');

        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        });

        // TODO: Provide better status code.
        ok(res.ok);

        const json = await res.json();
        const { id_token, access_token, refresh_token } = parse(TokenResponse, json);
        const { payload } = await jwtVerify(id_token, fetchJwks, {
            issuer: 'https://accounts.google.com',
            audience: GOOGLE.OAUTH_CLIENT_ID,
        });

        const token = parse(IdToken, payload);
        ok(token.email_verified);
        strictEqual(Buffer.from(token.nonce, 'base64url').compare(pending.nonce), 0);

        // Insert user as uninitialized by default
        await db.initUser(token.email);
        const { is_admin, lab_id } = await db.upsertOpenIdUser(
            token.email,
            token.sub,
            token.given_name,
            token.family_name,
            token.picture,
        );
        await db.insertValidSession(sid, token.email, token.exp);

        if (pending.has_extended_scope && typeof refresh_token !== 'undefined' && is_admin && lab_id === null)
            await db.upsertCandidateSender(token.email, token.exp, access_token, refresh_token);

        return { hasExtendedScope: pending.has_extended_scope, expires: token.exp };
    });

    cookies.set('sid', sid, { path: '/', httpOnly: true, sameSite: 'lax', expires });
    redirect(307, hasExtendedScope ? '/dashboard/email/' : '/');
}
