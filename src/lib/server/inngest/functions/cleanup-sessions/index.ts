import { lt } from 'drizzle-orm';

import { db } from '$lib/server/database';
import { inngest } from '$lib/server/inngest/client';
import { session } from '$lib/server/database/schema/auth';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'inngest.functions.cleanup-sessions';
const tracer = Tracer.byName(SERVICE_NAME);
const RETENTION_DAYS = 30;

export const cleanupSessions = inngest.createFunction(
  { id: 'cleanup-sessions', name: 'Cleanup Sessions' },
  { cron: '0 0 * * *' },
  async () =>
    await tracer.asyncSpan('cleanup-sessions', async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

      await db.delete(session).where(lt(session.expiredAt, cutoff));
    }),
);
