import { bigint, pgEnum, pgSchema, smallint, text, timestamp, unique } from 'drizzle-orm/pg-core';

import { draft, user } from './app';

import { bytea } from './custom/bytea';
import { ulid } from './custom/ulid';

export const email = pgSchema('email');

export const candidateSender = email.table('candidate_sender', {
  userId: ulid('user_id')
    .notNull()
    .references(() => user.id, { onUpdate: 'cascade', onDelete: 'cascade' })
    .primaryKey(),
  scopes: text('scopes').array().notNull().default([]),
  expiredAt: timestamp('expired_at', { mode: 'date', withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }),
  accessTokenIv: bytea('access_token_iv').notNull(),
  accessTokenCipher: bytea('access_token_cipher').notNull(),
  refreshTokenIv: bytea('refresh_token_iv').notNull(),
  refreshTokenCipher: bytea('refresh_token_cipher').notNull(),
});
export type CandidateSender = typeof candidateSender.$inferSelect;
export type NewCandidateSender = typeof candidateSender.$inferInsert;

export const designatedSender = email.table('designated_sender', {
  // Referencing the candidate sender table ensures that the user is not just any arbitrary user.
  candidateSenderUserId: ulid('candidate_sender_user_id')
    .notNull()
    .references(() => candidateSender.userId, { onUpdate: 'cascade', onDelete: 'cascade' })
    .primaryKey(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
});
export type DesignatedSender = typeof designatedSender.$inferSelect;
export type NewDesignatedSender = typeof designatedSender.$inferInsert;

export const inngestEventNameEnum = pgEnum('inngest_event_type_enum', [
  'round-started',
  'round-submitted',
  'lottery-intervened',
  'draft-concluded',
  'draft-finalization',
  'user-assigned',
]);
export type InngestEventName = (typeof inngestEventNameEnum.enumValues)[number];

export const gmailThread = email.table(
  'gmail_thread',
  {
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    id: bigint('id', { mode: 'bigint' }).notNull().generatedAlwaysAsIdentity().primaryKey(),
    draftId: bigint('draft_id', { mode: 'bigint' })
      .references(() => draft.id, { onUpdate: 'cascade' })
      .notNull(),
    eventType: inngestEventNameEnum('event_type').notNull(),
    round: smallint('round'),
    recipientUserId: ulid('recipient_user_id')
      .references(() => user.id, { onUpdate: 'cascade', onDelete: 'cascade' })
      .notNull(),
    // Historical root-send claim time.
    // While `gmail_thread_id` is null, this is also the active claim.
    claimedAt: timestamp('claimed_at', { mode: 'date', withTimezone: true }),
    gmailThreadId: text('gmail_thread_id'),
    gmailMessageIds: text('gmail_message_ids').array().notNull(),
  },
  ({ draftId, eventType, round, recipientUserId, gmailThreadId }) => [
    unique('gmail_thread_logical_key_idx')
      .on(draftId, eventType, round, recipientUserId)
      .nullsNotDistinct(),
    unique('gmail_thread_recipient_idx').on(gmailThreadId, recipientUserId),
  ],
);
export type GmailThread = typeof gmailThread.$inferSelect;
export type NewGmailThread = typeof gmailThread.$inferInsert;
