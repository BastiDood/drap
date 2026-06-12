import { Buffer } from 'node:buffer';
import { fail } from 'node:assert/strict';
import { timingSafeEqual } from 'node:crypto';

import addresses from 'email-addresses';
import { createRemoteJWKSet, customFetch, jwksCache, jwtVerify } from 'jose';
import { error, redirect } from '@sveltejs/kit';
import { parse } from 'valibot';
import { sql } from 'drizzle-orm';

import * as GOOGLE from '$lib/server/env/google';
import * as schema from '$lib/server/database/schema';
import { ASSERT_DOMAIN } from '$lib/server/env/drap/oauth';
import { assertSingle } from '$lib/server/assert';
import { AuthorizationCode, IdToken, TokenResponse } from '$lib/server/models/oauth';
import { db } from '$lib/server/database';
import { type DbConnection, upsertOpenIdUser } from '$lib/server/database/drizzle';
import { ENCRYPTION_KEY } from '$lib/server/env/drap/crypto';
import { encryptSecret } from '$lib/crypto';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';

const SERVICE_NAME = 'routes.dashboard.oauth.callback';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

/** Hoisted to the top level so that {@linkcode createRemoteJWKSet} can reuse it. */
const GOOGLE_JWKS_CACHE = Object.create(null);
export async function GET({ fetch, cookies, setHeaders, url: { searchParams } }) {
  setHeaders({
    'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });

  const fetchJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'), {
    [jwksCache]: GOOGLE_JWKS_CACHE,
    [customFetch]: fetch,
  });

  const nonceCookie = cookies.get('nonce');
  if (typeof nonceCookie === 'undefined') {
    logger.warn('nonce cookie not found');
    redirect(307, '/dashboard/oauth/login');
  }

  // Immediately delete the cookie (one-time use)
  cookies.delete('nonce', { path: '/dashboard/oauth', httpOnly: true, sameSite: 'lax' });

  const code = searchParams.get('code');
  if (code === null) {
    logger.fatal('missing authorization code');
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
      if (!token.email_verified) {
        logger.fatal('email not verified', void 0, { 'google.email': token.email });
        error(500, 'Email not verified.');
      }

      if (typeof ASSERT_DOMAIN !== 'undefined' && token.hd !== ASSERT_DOMAIN) {
        logger.fatal('hd claim mismatch', void 0, {
          'google.hd.expected': ASSERT_DOMAIN,
          'google.hd.actual': token.hd,
        });
        error(500, `Invalid hosted domain. Expected ${ASSERT_DOMAIN}.`);
      }

      // Validate UP email address
      const email = addresses.parseOneAddress(token.email);
      if (email === null) {
        logger.fatal('invalid email address from Google');
        error(500, 'Invalid email address provided by Google.');
      }

      switch (email.type) {
        case 'mailbox':
          if (typeof ASSERT_DOMAIN !== 'undefined' && email.domain !== ASSERT_DOMAIN) {
            logger.fatal('email address from external organization detected', void 0, {
              'google.email': token.email,
            });
            error(500, `Email address must be from ${ASSERT_DOMAIN}.`);
          }
          break;
        default:
          logger.fatal('invalid email address type from Google', void 0, {
            'google.email': token.email,
          });
          error(500, 'Invalid email address type provided by Google.');
      }

      // Validate nonce against the cookie
      const cookieNonce = Buffer.from(nonceCookie, 'base64url');
      const tokenNonce = Buffer.from(token.nonce, 'base64url');
      if (!timingSafeEqual(tokenNonce, cookieNonce)) {
        logger.fatal('nonce mismatch', void 0, {
          'nonce.cookie': nonceCookie,
          'nonce.token': token.nonce,
        });
        error(400, 'Nonce mismatch encountered.');
      }

      // Derive `hasExtendedScope` from the token response's scope field.
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
            'session.expired_at': token.exp.toISOString(),
          });

          if (
            hasExtendedScope &&
            typeof refresh_token !== 'undefined' &&
            isAdmin &&
            labId === null
          ) {
            await upsertCandidateSender(
              db,
              userId,
              token.exp,
              ENCRYPTION_KEY,
              access_token,
              refresh_token,
              scope,
            );
            logger.debug('amending credential scope for candidate sender', {
              'oauth.scopes': scope,
            });
          }

          return { hasExtendedScope, expires: token.exp, sid };
        },
        { isolationLevel: 'read committed' },
      );
    },
  );

  cookies.set('sid', sid, { path: '/dashboard', httpOnly: true, sameSite: 'lax', expires });

  logger.info('oauth callback complete', { 'oauth.scope.extended': hasExtendedScope });
  redirect(303, hasExtendedScope ? '/dashboard/users/#draft-admins' : '/dashboard/');
}

async function insertValidSession(db: DbConnection, userId: string, expiredAt: Date) {
  return await tracer.asyncSpan('insert-valid-session', async span => {
    span.setAttribute('database.user.id', userId);
    const { sessionId } = await db
      .insert(schema.session)
      .values({ userId, expiredAt })
      .returning({ sessionId: schema.session.id })
      .then(assertSingle);
    return sessionId;
  });
}

async function upsertCandidateSender(
  db: DbConnection,
  userId: string,
  expiredAt: Date,
  encryptionKey: CryptoKey,
  accessToken: string,
  refreshToken: string,
  scopes: string[],
) {
  return await tracer.asyncSpan('upsert-candidate-sender', async span => {
    span.setAttributes({
      'database.user.id': userId,
      'database.candidate_sender.expired_at': expiredAt.toISOString(),
    });
    const [encryptedAccessToken, encryptedRefreshToken] = await Promise.all([
      encryptSecret(encryptionKey, accessToken),
      encryptSecret(encryptionKey, refreshToken),
    ]);
    const { rowCount } = await db
      .insert(schema.candidateSender)
      .values({
        userId,
        expiredAt,
        accessTokenIv: Buffer.from(encryptedAccessToken.iv),
        accessTokenCipher: Buffer.from(encryptedAccessToken.cipher),
        refreshTokenIv: Buffer.from(encryptedRefreshToken.iv),
        refreshTokenCipher: Buffer.from(encryptedRefreshToken.cipher),
        scopes,
      })
      .onConflictDoUpdate({
        target: schema.candidateSender.userId,
        set: {
          updatedAt: sql`now()`,
          expiredAt: sql`excluded.${sql.raw(schema.candidateSender.expiredAt.name)}`,
          accessTokenIv: sql`excluded.${sql.raw(schema.candidateSender.accessTokenIv.name)}`,
          accessTokenCipher: sql`excluded.${sql.raw(schema.candidateSender.accessTokenCipher.name)}`,
          refreshTokenIv: sql`excluded.${sql.raw(schema.candidateSender.refreshTokenIv.name)}`,
          refreshTokenCipher: sql`excluded.${sql.raw(schema.candidateSender.refreshTokenCipher.name)}`,
          scopes: sql`excluded.${sql.raw(schema.candidateSender.scopes.name)}`,
        },
      });
    switch (rowCount) {
      case 1:
        return;
      default:
        fail(`upsertCandidateSender => unexpected insertion count ${rowCount}`);
    }
  });
}
