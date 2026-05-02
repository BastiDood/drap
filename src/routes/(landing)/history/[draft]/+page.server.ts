import { and, asc, desc, eq, isNotNull, isNull, lte, or } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { db } from '$lib/server/database';
import { type DbConnection, getDraftById } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';
import { validateBigInt } from '$lib/validators';

const SERVICE_NAME = 'routes.history.draft';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ params: { draft: id } }) {
  const draftId = validateBigInt(id);
  if (draftId === null) {
    logger.fatal('invalid draft id');
    error(404, 'Invalid draft ID.');
  }

  return await tracer.asyncSpan('load-history-draft-page', async span => {
    span.setAttribute('draft.id', draftId.toString());

    logger.debug('fetching draft', { 'draft.id': draftId.toString() });

    const draft = await getDraftById(db, draftId);
    if (typeof draft === 'undefined') {
      logger.fatal('draft not found');
      error(404, 'Draft not found.');
    }

    logger.debug('draft fetched', {
      'draft.round.current': draft.currRound,
      'draft.round.max': draft.maxRounds,
      'draft.registration.closes_at': draft.registrationClosedAt.toISOString(),
    });

    const events = await getDraftEvents(db, draftId);
    logger.debug('draft events fetched', { 'draft.event_count': events.length });

    return { draftId, draft, events };
  });
}

async function getDraftEvents(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-draft-events', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    return await db
      .selectDistinct({
        createdAt: schema.facultyChoice.createdAt,
        round: schema.facultyChoice.round,
        labId: schema.facultyChoice.labId,
        isSystem: isNull(schema.facultyChoice.userId).mapWith(Boolean),
      })
      .from(schema.facultyChoice)
      .innerJoin(schema.draft, eq(schema.facultyChoice.draftId, schema.draft.id))
      .leftJoin(
        schema.facultyChoiceUser,
        and(
          eq(schema.facultyChoice.draftId, schema.facultyChoiceUser.draftId),
          eq(schema.facultyChoice.labId, schema.facultyChoiceUser.labId),
          or(
            and(isNull(schema.facultyChoice.round), isNull(schema.facultyChoiceUser.round)),
            eq(schema.facultyChoice.round, schema.facultyChoiceUser.round),
          ),
        ),
      )
      .where(
        and(
          eq(schema.facultyChoice.draftId, draftId),
          or(
            lte(schema.facultyChoice.round, schema.draft.maxRounds),
            isNull(schema.facultyChoice.userId),
            isNotNull(schema.facultyChoiceUser.studentUserId),
          ),
        ),
      )
      .orderBy(({ createdAt, round, labId }) => [desc(createdAt), desc(round), asc(labId)]);
  });
}
