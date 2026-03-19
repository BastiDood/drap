import { lt } from 'drizzle-orm';

import { db } from '$lib/server/database';
import { inngest } from '$lib/server/inngest/client';
import { session } from '$lib/server/database/schema/auth';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'inngest.functions.cleanup-sessions';
const tracer = Tracer.byName(SERVICE_NAME);
const BATCH_SIZE = 1000;
const RETENTION_DAYS = 30;

export const cleanupSessions = inngest.createFunction(
  { id: 'cleanup-sessions', name: 'Cleanup Sessions' },
  { cron: '0 0 * * *' },
  async () =>
    await tracer.asyncSpan('cleanup-sessions', async () => {
      let deletedTotal = 0;

      while (true) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

        const deleted = await db
          .delete(session)
          .where(lt(session.expiredAt, cutoff))
          .returning({ id: session.id })
          .then(rows => rows.length);

        deletedTotal += deleted;

        if (deleted < BATCH_SIZE) break;
      }

      return { deletedTotal };
    }),
);
