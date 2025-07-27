import { Buffer } from 'node:buffer';
import { ok, strictEqual } from 'node:assert/strict';

import { error, redirect } from '@sveltejs/kit';
import { jwtVerify } from 'jose';
import { parse } from 'valibot';

import * as GOOGLE from '$lib/server/env/google';
import { AuthorizationCode, IdToken, TokenResponse } from '$lib/server/models/oauth';
import { fetchJwks } from '$lib/server/email/jwks';

export async function GET({
  fetch,
  locals: { db, session },
  cookies,
  setHeaders,
  url: { searchParams },
}) {
  setHeaders({ 'Cache-Control': 'no-store' });
  if (typeof session === 'undefined') redirect(307, '/oauth/login/');

  const code = searchParams.get('code');
  if (code === null) {
    cookies.delete('sid', { path: '/', httpOnly: true, sameSite: 'lax' });
    error(400, 'Authorization code is missing.');
  }

  const body = new URLSearchParams({
    code: parse(AuthorizationCode, code),
    client_id: GOOGLE.OAUTH_CLIENT_ID,
    client_secret: GOOGLE.OAUTH_CLIENT_SECRET,
    redirect_uri: GOOGLE.OAUTH_REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const sid = session.id;
  const { hasExtendedScope, expires } = await db.begin(async db => {
    const pending = await db.deletePendingSession(sid);
    if (typeof pending === 'undefined') {
      db.logger.error('pending session not found');
      redirect(307, '/oauth/login/');
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      const message = await res.text();
      db.logger.fatal({ status: res.status, message }, 'failed to fetch token');
      error(500, 'Cannot log you in at the moment. Please try again later.');
    }

    const json = await res.json();
    const { id_token, access_token, refresh_token } = parse(TokenResponse, json);
    const { payload } = await jwtVerify(id_token, fetchJwks, {
      issuer: 'https://accounts.google.com',
      audience: GOOGLE.OAUTH_CLIENT_ID,
    });

    const token = parse(IdToken, payload);
    ok(token.email_verified);
    strictEqual(Buffer.from(token.nonce, 'base64url').compare(pending.nonce), 0);

    // TODO: Merge this as a single upsert query.
    // Insert user as uninitialized by default
    const {
      id: userId,
      isAdmin,
      labId,
    } = await db.upsertOpenIdUser(
      token.email,
      token.sub,
      token.given_name,
      token.family_name,
      token.picture,
    );
    db.logger.info({ userId, isAdmin, labId }, 'user upserted');

    await db.insertValidSession(sid, userId, token.exp);
    db.logger.info({ expiration: token.exp }, 'valid session inserted');

    if (
      pending.hasExtendedScope &&
      typeof refresh_token !== 'undefined' &&
      isAdmin &&
      labId === null
    ) {
      await db.upsertCandidateSender(userId, token.exp, access_token, refresh_token);
      db.logger.info('amending credential scope for candidate sender');
    }

    return { hasExtendedScope: pending.hasExtendedScope, expires: token.exp };
  });

  cookies.set('sid', sid, { path: '/', httpOnly: true, sameSite: 'lax', expires });

  db.logger.info({ hasExtendedScope }, 'callback complete');
  redirect(303, hasExtendedScope ? '/dashboard/email/' : '/');
}
