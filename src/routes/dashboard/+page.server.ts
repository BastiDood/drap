import { redirect } from '@sveltejs/kit';

import { Logger } from '$lib/server/telemetry/logger';

import type { PageServerLoadEvent } from './$types';

const SERVICE_NAME = 'routes.dashboard.index';
const logger = Logger.byName(SERVICE_NAME);

export function load({ locals: { session } }: PageServerLoadEvent) {
  if (!session?.user) {
    logger.warn('attempt to access dashboard without session');
    redirect(307, '/dashboard/oauth/login');
  }

  const { user } = session;
  logger.debug('redirecting user to role-specific home', {
    'user.id': user.id,
    'user.is_admin': user.isAdmin,
    'user.lab_id': user.labId,
  });

  if (user.isAdmin) {
    if (user.labId === null) redirect(307, '/dashboard/drafts/'); // admin
    redirect(307, '/dashboard/lab/'); // faculty
  }

  if (user.labId === null) redirect(307, '/dashboard/student/'); // student
  redirect(307, '/dashboard/lab/'); // researcher
}
