import { count, eq } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { assertSingle } from '$lib/server/assert';
import { buildDraftAssignmentSummary } from '$lib/features/drafts/timeline/aggregates/builders';
import { db } from '$lib/server/database';
import { type DbConnection, getDraftById } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.admin.drafts.assignment-summary';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function GET({ params, locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.fatal('attempt to fetch assignment summary without session');
    error(401);
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to fetch assignment summary', void 0, {
      'user.is_admin': user.isAdmin,
      'user.google_id': user.googleUserId,
      'user.lab_id': user.labId,
    });
    error(403);
  }

  const {
    id: sessionId,
    user: { id: userId },
  } = session;

  return await tracer.asyncSpan('fetch-draft-assignment-summary', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
      'draft.id': params.draftId,
    });

    const draftId = BigInt(params.draftId);
    const summary = await db.transaction(
      async db => {
        const draft = await getDraftById(db, draftId);
        if (typeof draft === 'undefined') {
          logger.fatal('draft not found', void 0, { 'draft.id': draftId.toString() });
          error(404);
        }

        const studentCount = await getStudentCountInDraft(db, draftId);
        const quotaSnapshots = await getDraftLabQuotaSnapshots(db, draftId);
        const assignmentCountsByAttribute = await getDraftAssignmentCountsByAttribute(db, draftId);
        const labs = quotaSnapshots.map(({ labId, labName, initialQuota }) => ({
          id: labId,
          name: labName,
          quota: initialQuota,
        }));

        return buildDraftAssignmentSummary(
          assignmentCountsByAttribute,
          labs,
          draft.maxRounds,
          studentCount,
        );
      },
      { isolationLevel: 'repeatable read' },
    );

    logger.debug('assignment summary fetched', { 'draft.id': draftId.toString() });
    return json(summary);
  });
}

async function getStudentCountInDraft(db: DbConnection, id: bigint) {
  return await tracer.asyncSpan('get-student-count-in-draft', async span => {
    span.setAttribute('database.draft.id', id.toString());
    const { result } = await db
      .select({ result: count(schema.studentRank.userId) })
      .from(schema.studentRank)
      .where(eq(schema.studentRank.draftId, id))
      .then(assertSingle);
    return result;
  });
}

async function getDraftLabQuotaSnapshots(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-draft-lab-quota-snapshots', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    return await db
      .select({
        labId: schema.draftLabQuota.labId,
        labName: schema.lab.name,
        initialQuota: schema.draftLabQuota.initialQuota,
      })
      .from(schema.draftLabQuota)
      .innerJoin(schema.lab, eq(schema.draftLabQuota.labId, schema.lab.id))
      .where(eq(schema.draftLabQuota.draftId, draftId))
      .orderBy(({ labName }) => labName);
  });
}

async function getDraftAssignmentCountsByAttribute(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-draft-assignment-counts-by-lab', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    return await db
      .select({
        labId: schema.facultyChoiceUser.labId,
        round: schema.facultyChoiceUser.round,
        count: count(schema.facultyChoiceUser.studentUserId),
      })
      .from(schema.facultyChoiceUser)
      .where(eq(schema.facultyChoiceUser.draftId, draftId))
      .groupBy(({ labId, round }) => [labId, round]);
  });
}
