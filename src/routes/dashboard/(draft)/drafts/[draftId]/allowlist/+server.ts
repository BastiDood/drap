import * as devalue from 'devalue';
import { alias } from 'drizzle-orm/pg-core';
import { and, desc, eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { db } from '$lib/server/database';
import type { DbConnection } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.admin.drafts.allowlist';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function GET({ params, locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.fatal('attempt to fetch allowlist without session');
    error(401);
  }

  const { user } = session;
  if (!user.isAdmin || user.googleUserId === null || user.labId !== null) {
    logger.fatal('insufficient permissions to fetch allowlist', void 0, {
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

  return await tracer.asyncSpan('fetch-draft-allowlist', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
      'draft.id': params.draftId,
    });

    const draftId = BigInt(params.draftId);
    const allowlist = await getAllowlistByDraft(db, draftId);

    logger.debug('allowlist fetched', {
      'draft.id': draftId.toString(),
      'allowlist.count': allowlist.length,
    });

    return new Response(devalue.stringify(allowlist), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

async function getAllowlistByDraft(db: DbConnection, draftId: bigint) {
  return await tracer.asyncSpan('get-allowlist-by-draft', async span => {
    span.setAttribute('database.draft.id', draftId.toString());
    const student = alias(schema.user, 'student');
    const admin = alias(schema.user, 'admin');
    return await db
      .select({
        draftId: schema.draftRegistrationAllowlist.draftId,
        studentUserId: schema.draftRegistrationAllowlist.studentUserId,
        studentEmail: student.email,
        adminUserId: schema.draftRegistrationAllowlist.adminUserId,
        adminGivenName: admin.givenName,
        adminFamilyName: admin.familyName,
        adminEmail: admin.email,
        createdAt: schema.draftRegistrationAllowlist.createdAt,
        submittedAt: schema.studentRank.createdAt,
      })
      .from(schema.draftRegistrationAllowlist)
      .innerJoin(admin, eq(schema.draftRegistrationAllowlist.adminUserId, admin.id))
      .innerJoin(student, eq(schema.draftRegistrationAllowlist.studentUserId, student.id))
      .leftJoin(
        schema.studentRank,
        and(
          eq(schema.draftRegistrationAllowlist.draftId, schema.studentRank.draftId),
          eq(schema.draftRegistrationAllowlist.studentUserId, schema.studentRank.userId),
        ),
      )
      .where(eq(schema.draftRegistrationAllowlist.draftId, draftId))
      .orderBy(desc(schema.draftRegistrationAllowlist.createdAt));
  });
}
