import { Buffer } from 'node:buffer';
import { ok } from 'node:assert/strict';

import { createRemoteJWKSet, jwtVerify } from 'jose';
import { error, redirect } from '@sveltejs/kit';
import { parse } from 'valibot';

import * as GOOGLE from '$lib/server/env/google';
import { AuthorizationCode, IdToken, TokenResponse } from '$lib/server/models/oauth';
import { db } from '$lib/server/database';
import {
  insertValidSession,
  upsertCandidateSender,
  upsertOpenIdUser,
} from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const fetchJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';

const SERVICE_NAME = 'routes.dashboard.oauth.callback';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function GET({ fetch, cookies, setHeaders, url: { searchParams } }) {
  setHeaders({ 'Cache-Control': 'no-store' });

  const nonceCookie = cookies.get('nonce');
  if (typeof nonceCookie === 'undefined') {
    logger.warn('nonce cookie not found');
    redirect(307, '/dashboard/oauth/login');
  }

  // Immediately delete the cookie (one-time use)
  cookies.delete('nonce', { path: '/dashboard/oauth', httpOnly: true, sameSite: 'lax' });

  const code = searchParams.get('code');
  if (code === null) {
    logger.error('missing authorization code');
    error(400, 'Authorization code is missing.');
  }

  const body = new URLSearchParams({
    code: parse(AuthorizationCode, code),
    client_id: GOOGLE.OAUTH_CLIENT_ID,
    client_secret: GOOGLE.OAUTH_CLIENT_SECRET,
    redirect_uri: GOOGLE.OAUTH_REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const { hasExtendedScope, expires, sid } = await tracer.asyncSpan(
    'oauth-token-exchange',
    async () => {
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
      const { id_token, access_token, refresh_token, scope } = parse(TokenResponse, json);
      const { payload } = await jwtVerify(id_token, fetchJwks, {
        issuer: 'https://accounts.google.com',
        audience: GOOGLE.OAUTH_CLIENT_ID,
      });

      const token = parse(IdToken, payload);
      ok(token.email_verified);

      // Validate nonce against the cookie
      const nonce = Buffer.from(nonceCookie, 'base64url');
      if (Buffer.from(token.nonce, 'base64url').compare(nonce) !== 0) {
        logger.error('nonce mismatch');
        error(400, 'Invalid nonce.');
      }

      // Derive hasExtendedScope from the token response's scope field.
      // Note that if the user tampers with the scope field in the `/login` endpoint,
      // it would be possible for them to be upgraded to a candidate sender. This
      // shouldn't be a huge issue in practice because admins should be careful about
      // who they grant the "designated sender" privileges to.
      const hasExtendedScope = scope.includes(GMAIL_SEND_SCOPE);

      return await db.transaction(
        async db => {
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
          logger.debug('user upserted', {
            'user.id': userId,
            'user.is_admin': isAdmin,
            'user.lab_id': labId,
          });

          const sid = await insertValidSession(db, userId, token.exp);
          logger.debug('valid session inserted', {
            'session.id': sid,
            'session.expiration': token.exp.toISOString(),
          });

          if (
            hasExtendedScope &&
            typeof refresh_token !== 'undefined' &&
            isAdmin &&
            labId === null
          ) {
            await upsertCandidateSender(db, userId, token.exp, access_token, refresh_token, scope);
            logger.debug('amending credential scope for candidate sender', {
              'oauth.scopes': scope,
            });
          }

          return { hasExtendedScope, expires: token.exp, sid };
        },
        { isolationLevel: 'repeatable read' },
      );
    },
  );

  cookies.set('sid', sid, { path: '/dashboard', httpOnly: true, sameSite: 'lax', expires });

  logger.info('oauth callback complete', { 'oauth.scope.extended': hasExtendedScope });
  redirect(303, hasExtendedScope ? '/dashboard/email/' : '/dashboard/');
}
