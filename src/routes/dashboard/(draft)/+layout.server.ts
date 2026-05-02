import { and, eq, isNotNull, isNull } from 'drizzle-orm';

import * as schema from '$lib/server/database/schema';
import { db } from '$lib/server/database';
import { type DbConnection, getActiveDraft } from '$lib/server/database/drizzle';
import { Tracer } from '$lib/server/telemetry/tracer';

const tracer = Tracer.byName('routes.dashboard.draft.layout');

export async function load() {
  const [draft, candidateSenders] = await Promise.all([
    getActiveDraft(db),
    getCandidateSenders(db),
  ]);
  return {
    draft,
    candidateSenders,
  };
}

async function getCandidateSenders(db: DbConnection) {
  return await tracer.asyncSpan('get-candidate-senders', async () => {
    return await db
      .select({
        id: schema.user.id,
        email: schema.user.email,
        givenName: schema.user.givenName,
        familyName: schema.user.familyName,
        avatarUrl: schema.user.avatarUrl,
        isActive: isNotNull(schema.designatedSender.candidateSenderUserId).mapWith(Boolean),
      })
      .from(schema.candidateSender)
      .innerJoin(schema.user, eq(schema.candidateSender.userId, schema.user.id))
      .leftJoin(
        schema.designatedSender,
        eq(schema.candidateSender.userId, schema.designatedSender.candidateSenderUserId),
      )
      .where(
        and(isNotNull(schema.user.id), eq(schema.user.isAdmin, true), isNull(schema.user.labId)),
      )
      .orderBy(({ familyName }) => familyName);
  });
}
