import * as GOOGLE from '$lib/server/env/google';
import { OAUTH_SCOPE_STRING, SENDER_SCOPE_STRING } from '$lib/server/models/oauth';
import { error, redirect } from '@sveltejs/kit';

export async function GET({ locals: { db, session }, cookies, setHeaders, url: { searchParams } }) {
  setHeaders({ 'Cache-Control': 'no-store' });

  const hasExtendedScope = searchParams.has('extended');
  db.logger.info({ hasExtendedScope }, 'requested login');

  if (typeof session?.user !== 'undefined') {
    if (!hasExtendedScope) {
      db.logger.error('attempt to login with extended scope without admin privileges');
      redirect(307, '/');
    }
    if (
      session.user.googleUserId === null ||
      !session.user.isAdmin ||
      session.user.labId !== null
    ) {
      db.logger.error(
        {
          isAdmin: session.user.isAdmin,
          googleUserId: session.user.googleUserId,
          labId: session.user.labId,
        },
        'attempt to login with extended scope without admin privileges',
      );
      error(403);
    }
  }

  const { id: sessionId, nonce, expiration } = await db.generatePendingSession(hasExtendedScope);
  db.logger.info({ sessionId, expiration }, 'pending session generated');
  cookies.set('sid', sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    expires: expiration,
  });

  const params = new URLSearchParams({
    client_id: GOOGLE.OAUTH_CLIENT_ID,
    redirect_uri: GOOGLE.OAUTH_REDIRECT_URI,
    nonce: nonce.toString('base64url'),
    hd: 'up.edu.ph',
    response_type: 'code',
    prompt: 'select_account',
  });

  if (hasExtendedScope) {
    params.set('access_type', 'offline');
    params.set('scope', SENDER_SCOPE_STRING);
  } else {
    params.set('access_type', 'online');
    params.set('scope', OAUTH_SCOPE_STRING);
  }

  redirect(303, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
