import { error, redirect } from '@sveltejs/kit';

import { Logger } from '$lib/server/telemetry/logger';

import type { PageServerLoadEvent } from './$types';

const SERVICE_NAME = 'routes.dashboard.admin';
const logger = Logger.byName(SERVICE_NAME);

export function load({ locals: { session } }: PageServerLoadEvent) {
  if (typeof session?.user === 'undefined') {
    logger.error('attempt to access admin dashboard without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { user } = session;

  if (!user.isAdmin) {
    logger.error('non-admin attempting to access admin dashboard', void 0, {
      'user.id': user.id,
      'user.is_admin': user.isAdmin,
    });
    error(403);
  }

  logger.debug('admin dashboard loaded', {
    'user.id': user.id,
    'user.email': user.email,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      givenName: user.givenName,
      familyName: user.familyName,
      avatarUrl: user.avatarUrl,
      labId: user.labId,
    },
  };
}
