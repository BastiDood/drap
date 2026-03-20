import { cron } from 'inngest';
import { lt, sql } from 'drizzle-orm';

import { db } from '$lib/server/database';
import { inngest } from '$lib/server/inngest/client';
import { Logger } from '$lib/server/telemetry/logger';
import { session } from '$lib/server/database/schema/auth';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'inngest.functions.cleanup-sessions';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export const cleanupSessions = inngest.createFunction(
  {
    id: 'cleanup-sessions',
    name: 'Cleanup Sessions',
    triggers: [cron('0 0 * * *')],
  },
  async ({ step }) =>
    await step.run(
      { id: 'delete-expired-sessions', name: 'Delete Expired Sessions' },
      async () =>
        await tracer.asyncSpan('delete-expired-sessions', async () => {
          const { rowCount } = await db
            .delete(session)
            .where(lt(session.expiredAt, sql`now() - interval '30 days'`));
          logger.info('sessions cleaned up', { count: rowCount });
          return rowCount;
        }),
    ),
);
