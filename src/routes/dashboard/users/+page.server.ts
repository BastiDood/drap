import { fail as assertFail } from 'node:assert/strict';

import * as v from 'valibot';
import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { decode } from 'decode-formdata';
import { error, fail, redirect } from '@sveltejs/kit';

import * as schema from '$lib/server/database/schema';
import { db } from '$lib/server/database';
import {
  type DbConnection,
  getFacultyAndStaff,
  getLabRegistry,
} from '$lib/server/database/drizzle';
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const AdminFormData = v.object({
  email: v.pipe(v.string(), v.email()),
});

const FacultyFormData = v.object({
  email: v.pipe(v.string(), v.email()),
  invite: v.pipe(v.string(), v.minLength(1)),
});

const DeleteInviteFormData = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
});

const SenderFormData = v.object({
  userId: v.pipe(v.string(), v.minLength(1)),
});

const SERVICE_NAME = 'routes.dashboard.users';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);

export async function load({ locals: { session } }) {
  if (typeof session?.user === 'undefined') {
    logger.error('attempt to access users page without session');
    redirect(307, '/dashboard/oauth/login');
  }

  if (!session.user.isAdmin || session.user.googleUserId === null || session.user.labId !== null) {
    logger.fatal('insufficient permissions to access users page', void 0, {
      'user.is_admin': session.user.isAdmin,
      'user.google_id': session.user.googleUserId,
      'user.lab_id': session.user.labId,
    });
    error(403);
  }

  const {
    id: sessionId,
    user: { id: userId },
  } = session;

  return await tracer.asyncSpan('load-users-page', async span => {
    span.setAttributes({
      'session.id': sessionId,
      'session.user.id': userId,
    });

    const [labs, faculty, candidateSenders] = await Promise.all([
      getLabRegistry(db),
      getFacultyAndStaff(db),
      getCandidateSenders(db),
    ]);
    logger.debug('users page loaded', {
      'lab.count': labs.length,
      'user.faculty_count': faculty.length,
      'email.sender.count': candidateSenders.length,
    });
    return { labs, faculty, candidateSenders, selfUserId: userId };
  });
}

export const actions = {
  async admin({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to invite user without session');
      error(401);
    }

    if (
      !session.user.isAdmin ||
      session.user.googleUserId === null ||
      session.user.labId !== null
    ) {
      logger.fatal('insufficient permissions to invite user', void 0, {
        'user.is_admin': session.user.isAdmin,
        'user.google_id': session.user.googleUserId,
        'user.lab_id': session.user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.admin', async () => {
      const data = await request.formData();
      const { email } = v.parse(AdminFormData, decode(data));
      logger.debug('inviting new admin', { 'payload.email': email });

      if (await inviteNewFacultyOrStaff(db, email, null)) {
        logger.info('new admin invited');
        return;
      }

      logger.fatal('admin email was already invited before');
      return fail(409);
    });
  },
  async faculty({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to invite faculty without session');
      error(401);
    }

    if (
      !session.user.isAdmin ||
      session.user.googleUserId === null ||
      session.user.labId !== null
    ) {
      logger.fatal('insufficient permissions to invite faculty', void 0, {
        'user.is_admin': session.user.isAdmin,
        'user.google_id': session.user.googleUserId,
        'user.lab_id': session.user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.faculty', async () => {
      const data = await request.formData();
      const { email, invite: lab } = v.parse(FacultyFormData, decode(data));
      logger.debug('inviting new faculty', { 'payload.email': email, 'payload.lab': lab });

      if (await inviteNewFacultyOrStaff(db, email, lab)) {
        logger.info('new faculty invited');
        return;
      }

      logger.fatal('faculty email was already invited before');
      return fail(409);
    });
  },
  async 'delete-invite'({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to delete invite without session');
      error(401);
    }

    if (
      !session.user.isAdmin ||
      session.user.googleUserId === null ||
      session.user.labId !== null
    ) {
      logger.fatal('insufficient permissions to delete invite', void 0, {
        'user.is_admin': session.user.isAdmin,
        'user.google_id': session.user.googleUserId,
        'user.lab_id': session.user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.delete-invite', async () => {
      const data = await request.formData();
      const { id } = v.parse(DeleteInviteFormData, decode(data));
      logger.debug('deleting invite', { 'payload.id': id });

      if (await deleteInvitation(db, id)) {
        logger.info('invite deleted');
        return;
      }

      logger.fatal('invite could not be deleted');
      return fail(404);
    });
  },
  async promote({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to promote sender without session');
      error(401);
    }

    if (
      !session.user.isAdmin ||
      session.user.googleUserId === null ||
      session.user.labId !== null
    ) {
      logger.fatal('insufficient permissions to promote sender', void 0, {
        'user.is_admin': session.user.isAdmin,
        'user.google_id': session.user.googleUserId,
        'user.lab_id': session.user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.promote', async () => {
      const data = await request.formData();
      const { userId } = v.parse(SenderFormData, decode(data));
      logger.debug('promoting sender', { 'email.sender.user_id': userId });

      if (await upsertDesignatedSender(db, userId)) {
        logger.info('sender promoted as designated sender');
        return;
      }

      logger.fatal('sender does not exist', void 0, { 'email.sender.user_id': userId });
      error(404);
    });
  },
  async demote({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to demote sender without session');
      error(401);
    }

    if (
      !session.user.isAdmin ||
      session.user.googleUserId === null ||
      session.user.labId !== null
    ) {
      logger.fatal('insufficient permissions to demote sender', void 0, {
        'user.is_admin': session.user.isAdmin,
        'user.google_id': session.user.googleUserId,
        'user.lab_id': session.user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.demote', async () => {
      const data = await request.formData();
      const { userId } = v.parse(SenderFormData, decode(data));
      logger.debug('demoting sender', { 'email.sender.user_id': userId });

      if (await deleteDesignatedSender(db, userId)) {
        logger.info('sender demoted');
        return;
      }

      logger.fatal('sender does not exist');
      error(404, 'Designated sender does not exist.');
    });
  },
  async remove({ locals: { session }, request }) {
    if (typeof session?.user === 'undefined') {
      logger.fatal('attempt to remove sender without session');
      error(401);
    }

    if (
      !session.user.isAdmin ||
      session.user.googleUserId === null ||
      session.user.labId !== null
    ) {
      logger.fatal('insufficient permissions to remove sender', void 0, {
        'user.is_admin': session.user.isAdmin,
        'user.google_id': session.user.googleUserId,
        'user.lab_id': session.user.labId,
      });
      error(403);
    }

    return await tracer.asyncSpan('action.remove', async () => {
      const data = await request.formData();
      const { userId } = v.parse(SenderFormData, decode(data));
      logger.debug('removing sender', { 'email.sender.user_id': userId });

      if (await deleteCandidateSender(db, userId)) {
        logger.info('sender removed');
        return;
      }

      logger.fatal('sender does not exist');
      error(404, 'Sender email does not exist.');
    });
  },
};

async function inviteNewFacultyOrStaff(db: DbConnection, email: string, labId: string | null) {
  return await tracer.asyncSpan('invite-new-faculty-or-staff', async span => {
    span.setAttribute('database.user.email', email);
    if (labId !== null) span.setAttribute('database.lab.id', labId);
    const { rowCount } = await db
      .insert(schema.user)
      .values({ email, labId, isAdmin: true })
      .onConflictDoNothing({ target: schema.user.email });
    switch (rowCount) {
      case 0:
        return false;
      case 1:
        return true;
      default:
        assertFail(`inviteNewFacultyOrStaff => unexpected insertion count ${rowCount}`);
    }
  });
}

async function deleteInvitation(db: DbConnection, id: string) {
  return await tracer.asyncSpan('delete-invitation', async span => {
    span.setAttribute('database.user.id', id);
    const { rowCount } = await db
      .delete(schema.user)
      .where(
        and(
          eq(schema.user.id, id),
          eq(schema.user.isAdmin, true),
          isNull(schema.user.googleUserId),
        ),
      );
    switch (rowCount) {
      case 0:
        return false;
      case 1:
        return true;
      default:
        assertFail(`deleteInvitation => unexpected deletion count ${rowCount}`);
    }
  });
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

async function upsertDesignatedSender(db: DbConnection, userId: string) {
  return await tracer.asyncSpan('upsert-designated-sender', async span => {
    span.setAttribute('database.user.id', userId);
    return await db.transaction(async tx => {
      await tx.execute(sql`lock table ${schema.designatedSender} in exclusive mode`);
      const [candidate] = await tx
        .select({ userId: schema.candidateSender.userId })
        .from(schema.candidateSender)
        .where(eq(schema.candidateSender.userId, userId))
        .limit(1);
      if (typeof candidate === 'undefined') return false;
      await tx.delete(schema.designatedSender);
      const { rowCount } = await tx
        .insert(schema.designatedSender)
        .values({ candidateSenderUserId: userId });
      switch (rowCount) {
        case 1:
          return true;
        default:
          assertFail(`upsertDesignatedSender => unexpected insertion count ${rowCount}`);
      }
    });
  });
}

async function deleteDesignatedSender(db: DbConnection, userId: string) {
  return await tracer.asyncSpan('delete-designated-sender', async span => {
    span.setAttribute('database.user.id', userId);
    const { rowCount } = await db
      .delete(schema.designatedSender)
      .where(eq(schema.designatedSender.candidateSenderUserId, userId));
    switch (rowCount) {
      case 0:
        return false;
      case 1:
        return true;
      default:
        assertFail(`deleteDesignatedSender => unexpected delete count ${rowCount}`);
    }
  });
}

async function deleteCandidateSender(db: DbConnection, userId: string) {
  return await tracer.asyncSpan('delete-candidate-sender', async span => {
    span.setAttribute('database.user.id', userId);
    const { rowCount } = await db
      .delete(schema.candidateSender)
      .where(eq(schema.candidateSender.userId, userId));
    switch (rowCount) {
      case 0:
        return false;
      case 1:
        return true;
      default:
        assertFail(`deleteCandidateSender => unexpected delete count ${rowCount}`);
    }
  });
}
