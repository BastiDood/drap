import * as devalue from 'devalue';
import { alias } from 'drizzle-orm/pg-core';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { db } from '$lib/server/database';
import type { DbConnection } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.admin.drafts.faculty-choices';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function GET({ params, locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.fatal('attempt to fetch draft faculty choices without session');
    error(401);
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to fetch draft faculty choices', void 0, {
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

  return await tracer.asyncSpan('fetch-draft-faculty-choices', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
      'draft.id': params.draftId,
    });

    const draftId = BigInt(params.draftId);
    const facultyChoices = await getFacultyChoiceRecords(db, draftId);

    logger.debug('draft faculty choices fetched', {
      'draft.id': draftId.toString(),
      'draft_faculty_choices.count': facultyChoices.length,
    });

    return new Response(devalue.stringify(facultyChoices), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

async function getFacultyChoiceRecords(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-faculty-choice-records', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const facultyUser = alias(schema.user, 'faculty_user');
    const studentUser = alias(schema.user, 'student_user');
    return await db
      .select({
        draftId: schema.facultyChoice.draftId,
        round: schema.facultyChoice.round,
        labId: schema.facultyChoice.labId,
        createdAt: schema.facultyChoice.createdAt,
        userId: schema.facultyChoice.userId,
        userEmail: facultyUser.email,
        studentEmail: studentUser.email,
      })
      .from(schema.facultyChoice)
      .leftJoin(facultyUser, eq(schema.facultyChoice.userId, facultyUser.id))
      .leftJoin(
        schema.facultyChoiceUser,
        and(
          eq(schema.facultyChoice.draftId, schema.facultyChoiceUser.draftId),
          eq(schema.facultyChoice.labId, schema.facultyChoiceUser.labId),
          sql`${schema.facultyChoice.round} is not distinct from ${schema.facultyChoiceUser.round}`,
        ),
      )
      .leftJoin(studentUser, eq(schema.facultyChoiceUser.studentUserId, studentUser.id))
      .where(eq(schema.facultyChoice.draftId, draftId))
      .orderBy(
        desc(schema.facultyChoice.createdAt),
        sql`${schema.facultyChoice.round} desc nulls first`,
        asc(schema.facultyChoice.labId),
      );
  });
}
