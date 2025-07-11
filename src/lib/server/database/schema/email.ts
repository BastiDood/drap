import { jsonb, pgSchema, text, timestamp } from 'drizzle-orm/pg-core';
import type { Notification } from '$lib/server/models/notification';
import { sql } from 'drizzle-orm';
import { ulid } from './custom/ulid';
import { user } from './app';

export const email = pgSchema('email');

export const candidateSender = email.table('candidate_sender', {
  userId: ulid('user_id')
    .notNull()
    .references(() => user.id, { onUpdate: 'cascade', onDelete: 'cascade' })
    .primaryKey(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiration: timestamp('expiration', { mode: 'date', withTimezone: true }).notNull(),
});
export type CandidateSender = typeof candidateSender.$inferSelect;
export type NewCandidateSender = typeof candidateSender.$inferInsert;

export const designatedSender = email.table('designated_sender', {
  // Referencing the candidate sender table ensures that the user is not just any arbitrary user.
  candidateSenderUserId: ulid('candidate_sender_user_id')
    .notNull()
    .references(() => candidateSender.userId, { onUpdate: 'cascade', onDelete: 'cascade' })
    .primaryKey(),
});
export type DesignatedSender = typeof designatedSender.$inferSelect;
export type NewDesignatedSender = typeof designatedSender.$inferInsert;

export const notification = email.table('notification', {
  id: ulid('id')
    .primaryKey()
    .default(sql`gen_ulid()`),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  deliveredAt: timestamp('delivered_at', { mode: 'date' }),
  data: jsonb('metadata').$type<Notification>().notNull(),
});
export type NotificationRequest = typeof notification.$inferSelect;
export type NewNotificationRequest = typeof notification.$inferInsert;
