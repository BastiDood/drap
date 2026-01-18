import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'hooks';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function handle({ event, resolve }) {
  const { cookies, locals, request, getClientAddress } = event;
  return await tracer.asyncSpan('http-request', async span => {
    span.setAttributes({
      'http.request.id': crypto.randomUUID(),
      'http.request.method': request.method,
      'http.request.url': request.url,
      'network.client.address': getClientAddress(),
    });

    const realIp = request.headers.get('X-Real-IP');
    if (realIp !== null) span.setAttribute('network.client.real_ip', realIp);

    const forwardedFor = request.headers.get('X-Forwarded-For');
    if (forwardedFor !== null) span.setAttribute('network.client.forwarded_for', forwardedFor);

    const sid = cookies.get('sid');
    if (typeof sid !== 'undefined') {
      // Dynamic import is required here to avoid database connections during prerendering.
      const { db, getUserFromValidSession } = await import('$lib/server/database');

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
    return await resolve(event);
  });
}

export async function handleError({ error }) {
  const { Logger } = await import('$lib/server/telemetry/logger');
  const logger = Logger.byName('hooks');
  if (error instanceof Error) logger.error(error.message, error);
  else logger.error(String(error));
}
