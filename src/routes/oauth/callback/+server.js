import { Buffer } from 'node:buffer';
import { ok, strictEqual } from 'node:assert/strict';

import { error, redirect } from '@sveltejs/kit';
import { jwtVerify } from 'jose';
import { parse } from 'valibot';

import * as GOOGLE from '$lib/server/env/google';
import { AuthorizationCode, IdToken, TokenResponse } from '$lib/server/models/oauth';
import {
  begin,
  db,
  deletePendingSession,
  insertValidSession,
  upsertCandidateSender,
  upsertOpenIdUser,
} from '$lib/server/database';
import { fetchJwks } from '$lib/server/email/jwks';
import { Logger } from '$lib/server/telemetry/logger';

const SERVICE_NAME = 'routes.oauth.callback';
const logger = Logger.byName(SERVICE_NAME);

export async function GET({
  fetch,
  locals: { session },
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
  const { hasExtendedScope, expires } = await begin(db, async db => {
    const pending = await deletePendingSession(db, sid);
    if (typeof pending === 'undefined') {
      logger.error('pending session not found');
      redirect(307, '/oauth/login/');
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      const message = await res.text();
      logger.fatal('failed to fetch token', void 0, { status: res.status, message });
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
    } = await upsertOpenIdUser(
      db,
      token.email,
      token.sub,
      token.given_name,
      token.family_name,
      token.picture,
    );
    logger.info('user upserted', {
      'user.id': userId,
      'auth.user.is_admin': isAdmin,
      'user.lab_id': labId,
    });

    await insertValidSession(db, sid, userId, token.exp);
    logger.info('valid session inserted', { 'auth.session.expiration': token.exp.toISOString() });

    if (
      pending.hasExtendedScope &&
      typeof refresh_token !== 'undefined' &&
      isAdmin &&
      labId === null
    ) {
      await upsertCandidateSender(db, userId, token.exp, access_token, refresh_token);
      logger.info('amending credential scope for candidate sender');
    }

    return { hasExtendedScope: pending.hasExtendedScope, expires: token.exp };
  });

  cookies.set('sid', sid, { path: '/', httpOnly: true, sameSite: 'lax', expires });

  logger.info('callback complete', { 'oauth.scope.extended': hasExtendedScope });
  redirect(303, hasExtendedScope ? '/dashboard/email/' : '/');
}
