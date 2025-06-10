import * as GOOGLE from '$lib/server/env/google';
import { OAUTH_SCOPE_STRING, SENDER_SCOPE_STRING } from '$lib/models/oauth';
import { error, redirect } from '@sveltejs/kit';

export async function GET({ locals: { db }, cookies, setHeaders, url: { searchParams } }) {
  setHeaders({ 'Cache-Control': 'no-store' });
  const sid = cookies.get('sid');
  const hasExtendedScope = searchParams.has('extended');
  if (typeof sid !== 'undefined') {
    // Allow only admins through extended scope flow
    const user = await db.getUserFromValidSession(sid);
    if (user !== null) {
      if (!hasExtendedScope) redirect(307, '/');
      if (user?.googleUserId === null || !user?.isAdmin || user.labId !== null) error(403);
    }
  }

  const { id: sessionId, nonce, expiration } = await db.generatePendingSession(hasExtendedScope);
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
  });

  if (hasExtendedScope) {
    params.set('access_type', 'offline');
    params.set('scope', SENDER_SCOPE_STRING);
    params.set('prompt', 'consent');
  } else {
    params.set('access_type', 'online');
    params.set('scope', OAUTH_SCOPE_STRING);
  }

  redirect(307, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
