export async function handle({ event, resolve }) {
  const { cookies, locals, request, getClientAddress } = event;

  const sid = cookies.get('sid');
  if (typeof sid !== 'undefined') {
    // Dynamic import required to avoid invocation during pre-rendering.
    const { db, getUserFromValidSession } = await import('$lib/server/database');
    const { logger, tracer } = await import('./hooks.telemetry');

    await tracer.asyncSpan('http-request', async span => {
      // eslint-disable-next-line @typescript-eslint/init-declarations
      let clientAddress: string | undefined;
      try {
        clientAddress = getClientAddress();
      } catch (error) {
        if (error instanceof Error) logger.error('failed to get client address', error);
        else throw error;
      }

      span.setAttributes({
        'http.request.id': crypto.randomUUID(),
        'http.request.method': request.method,
        'http.request.url': request.url,
        'network.client.address': clientAddress,
      });

      const realIp = request.headers.get('X-Real-IP');
      if (realIp !== null) span.setAttribute('network.client.real_ip', realIp);

      const forwardedFor = request.headers.get('X-Forwarded-For');
      if (forwardedFor !== null) span.setAttribute('network.client.forwarded_for', forwardedFor);

      const sid = cookies.get('sid');
      if (typeof sid !== 'undefined') {
        logger.trace('finding session...');
        const user = await getUserFromValidSession(db, sid);

        locals.session = { id: sid, user };
        span.setAttributes({ 'http.session.id': sid });

        if (typeof user !== 'undefined') {
          span.setAttributes({
            'http.session.user.id': user.id,
            'http.session.user.email': user.email,
            'http.session.user.is_admin': user.isAdmin,
            'http.session.user.given_name': user.givenName,
            'http.session.user.family_name': user.familyName,
          });
          if (user.labId !== null) span.setAttribute('http.session.user.lab_id', user.labId);
          if (user.studentNumber !== null)
            span.setAttribute('http.session.user.student_number', user.studentNumber.toString());
        }
      }

      logger.trace('resolving request...');
    });
  }

  return await resolve(event);
}

export async function handleError({ error }) {
  const { Logger } = await import('$lib/server/telemetry/logger');
  const logger = Logger.byName('hooks.handleError');
  if (error instanceof Error) logger.error(error.message, error);
  else logger.error(String(error));
}
