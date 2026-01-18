import { db, getDrafts } from '$lib/server/database';
import { Logger } from '$lib/server/telemetry/logger';

const SERVICE_NAME = 'routes.history';
const logger = Logger.byName(SERVICE_NAME);

export async function load() {
  const drafts = await getDrafts(db);
  logger.info('drafts fetched', { 'draft.count': drafts.length });
  return { drafts };
}
