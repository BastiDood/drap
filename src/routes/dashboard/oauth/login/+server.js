import { addMinutes } from 'date-fns';
import { error, redirect } from '@sveltejs/kit';

import * as GOOGLE from '$lib/server/env/google';
import { Logger } from '$lib/server/telemetry/logger';
import { OAUTH_SCOPE_STRING, SENDER_SCOPE_STRING } from '$lib/server/models/oauth';

const SERVICE_NAME = 'routes.dashboard.oauth.login';
const logger = Logger.byName(SERVICE_NAME);

export function GET({ locals: { session }, cookies, setHeaders, url: { searchParams } }) {
  setHeaders({ 'Cache-Control': 'no-store' });

  const hasExtendedScope = searchParams.has('extended');
  logger.info('requested login', { 'oauth.scope.extended': hasExtendedScope });

  if (typeof session?.user !== 'undefined') {
    if (!hasExtendedScope) {
      logger.error('attempt to login with extended scope without admin privileges');
      redirect(307, '/dashboard/');
    }
    if (
      session.user.googleUserId === null ||
      !session.user.isAdmin ||
      session.user.labId !== null
    ) {
      logger.error('attempt to login with extended scope without admin privileges', void 0, {
        'user.is_admin': session.user.isAdmin,
        'user.google_id': session.user.googleUserId,
        'user.lab_id': session.user.labId,
      });
      error(403);
    }
  }

  const random = crypto.getRandomValues(new Uint8Array(64));
  const nonce = Buffer.from(random).toString('base64url');
  const expiration = addMinutes(new Date(), 15);
  cookies.set('nonce', nonce, {
    path: '/dashboard/oauth',
    httpOnly: true,
    sameSite: 'lax',
    expires: expiration,
  });

  const params = new URLSearchParams({
    client_id: GOOGLE.OAUTH_CLIENT_ID,
    redirect_uri: GOOGLE.OAUTH_REDIRECT_URI,
    nonce,
    hd: 'up.edu.ph',
    response_type: 'code',
    prompt: 'select_account',
  });

  if (hasExtendedScope) {
    // https://github.com/googleapis/google-api-python-client/issues/213
    // prompt=consent + access_type=offline is necessary to generate refresh tokens!
    params.set('prompt', 'consent');
    params.set('access_type', 'offline');
    params.set('scope', SENDER_SCOPE_STRING);
  } else {
    params.set('prompt', 'select_account');
    params.set('access_type', 'online');
    params.set('scope', OAUTH_SCOPE_STRING);
  }

  redirect(303, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
