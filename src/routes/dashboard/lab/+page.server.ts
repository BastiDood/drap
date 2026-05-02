import { and, asc, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { assertOptional } from '$lib/server/assert';
import { db } from '$lib/server/database';
import { type DbConnection, getDrafts } from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.lab';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.error('attempt to access lab page without session');
    redirect(307, '/dashboard/oauth/login');
  }

  if (session.user.googleUserId === null || session.user.labId === null) {
    logger.fatal('insufficient permissions to access lab page', void 0, {
      isAdmin: session.user.isAdmin,
      googleUserId: session.user.googleUserId,
      labId: session.user.labId,
    });
    error(403);
  }

  const {
    id: sessionId,
    user: { id: userId, isAdmin, googleUserId, labId },
  } = session;

  return await tracer.asyncSpan('load-lab-page', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
      'session.user.is_admin': isAdmin,
    });
    if (labId !== null) span.setAttribute('session.user.lab_id', labId);
    if (googleUserId !== null) span.setAttribute('session.user.google_id', googleUserId);

    // eslint-disable-next-line @typescript-eslint/init-declarations
    let info: Awaited<ReturnType<typeof getLabMembers>>;
    if (isAdmin) {
      logger.debug('admin accessing the lab page');
      info = await getLabMembers(db, labId);
    } else {
      const userLatestDraft = await getUserLabAssignmentDraftId(db, userId, labId);
      if (typeof userLatestDraft === 'undefined') {
        // The assumption here is that the user was invited as a faculty member
        // (and thus has no prior draft results).
        logger.debug('faculty accessing the lab page');
        info = await getLabMembers(db, labId);
      } else {
        // If the user was invited to this lab via regular draft methods, they are treated as a
        // student/researcher of the lab. This is a required check to ensure that the user can only
        // see lab members of their own draft class. Otherwise, every student can see all lab members
        // of all time, which is poor data privacy hygiene.
        logger.debug('researcher accessing the lab page');
        info = await getLabMembers(db, labId, userLatestDraft.draftId);
      }
    }

    const drafts = await getDrafts(db);
    return { ...info, drafts };
  });
}

async function getLabMembers(db: DbConnection, labId: string, draftId?: bigint) {
  return await tracer.asyncSpan('get-lab-members', async span => {
    span.setAttribute('database.lab.id', labId);
    if (typeof draftId !== 'undefined') span.setAttribute('database.draft.id', draftId.toString());
    const labInfo = await db.query.lab.findFirst({
      columns: { name: true },
      where: ({ id }) => eq(id, labId),
    });

    const heads = await db.query.user.findMany({
      columns: {
        email: true,
        givenName: true,
        familyName: true,
        avatarUrl: true,
      },
      where: (table, { and }) =>
        and(isNotNull(table.id), eq(table.labId, labId), eq(table.isAdmin, true)),
      orderBy: ({ familyName }) => familyName,
    });

    const faculty = await db
      .select({
        email: schema.user.email,
        givenName: schema.user.givenName,
        familyName: schema.user.familyName,
        avatarUrl: schema.user.avatarUrl,
      })
      .from(schema.user)
      .leftJoin(
        schema.facultyChoiceUser,
        eq(schema.user.id, schema.facultyChoiceUser.studentUserId),
      )
      .where(
        and(
          eq(schema.user.labId, labId),
          eq(schema.user.isAdmin, false),
          isNull(schema.facultyChoiceUser.studentUserId),
        ),
      );

    const membersQuery =
      typeof draftId === 'undefined'
        ? db
            .select({
              draftId: schema.labMemberView.draftId,
              email: schema.labMemberView.email,
              givenName: schema.labMemberView.givenName,
              familyName: schema.labMemberView.familyName,
              avatarUrl: schema.labMemberView.avatarUrl,
            })
            .from(schema.labMemberView)
            .where(eq(schema.labMemberView.draftLab, labId))
            .orderBy(({ draftId, familyName }) => [asc(draftId), asc(familyName)])
        : db
            .select({
              draftId: schema.labMemberView.draftId,
              email: schema.labMemberView.email,
              givenName: schema.labMemberView.givenName,
              familyName: schema.labMemberView.familyName,
              avatarUrl: schema.labMemberView.avatarUrl,
            })
            .from(schema.labMemberView)
            .where(
              and(
                eq(schema.labMemberView.draftLab, labId),
                eq(schema.labMemberView.draftId, draftId),
              ),
            )
            .orderBy(({ draftId, familyName }) => [asc(draftId), asc(familyName)]);
    return { lab: labInfo?.name, heads, members: await membersQuery, faculty };
  });
}

async function getUserLabAssignmentDraftId(db: DbConnection, userId: string, labId: string) {
  return await tracer.asyncSpan('get-user-lab-assignment-draft-id', async span => {
    span.setAttributes({ 'database.user.id': userId, 'database.lab.id': labId });
    return await db
      .select({ draftId: schema.labMemberView.draftId })
      .from(schema.labMemberView)
      .where(and(eq(schema.labMemberView.userId, userId), eq(schema.labMemberView.draftLab, labId)))
      .orderBy(desc(schema.labMemberView.draftId))
      .then(assertOptional);
  });
}
