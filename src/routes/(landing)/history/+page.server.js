import { db, getDrafts } from '$lib/server/database';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.history';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load() {
  return await tracer.asyncSpan('load-history-page', async () => {
    const drafts = await getDrafts(db);
    logger.debug('drafts fetched', { 'draft.count': drafts.length });
    return { drafts };
  });
}
