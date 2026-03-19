import { inngest } from '$lib/server/inngest/client';
import { db } from '$lib/server/database';
import { schema } from '$lib/server/database/drizzle';
import { Tracer } from '$lib/server/telemetry/tracer';
import { lt } from 'drizzle-orm';

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
          .delete(schema.session)
          .where(lt(schema.session.expiredAt, cutoff))
          .returning({ id: schema.session.id })
          .then(rows => rows.length);

        deletedTotal += deleted;

        if (deleted < BATCH_SIZE) break;
      }

      return { deletedTotal };
    }),
);
