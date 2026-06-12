import { bigint, pgEnum, pgSchema, smallint, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { SQL, sql } from 'drizzle-orm';

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
  'draft/round.started.email.batch',
  'draft/round.started.email.fallback',
  'draft/round.submitted.email.batch',
  'draft/round.submitted.email.fallback',
  'draft/lottery.intervened.email.batch',
  'draft/lottery.intervened.email.fallback',
  'draft/draft.concluded.email.batch',
  'draft/draft.concluded.email.fallback',
  'draft/draft.finalization.email.batch',
  'draft/draft.finalization.email.fallback',
  'draft/user.assigned.email.batch',
  'draft/user.assigned.email.fallback',
]);
export type InngestEventName = typeof inngestEventNameEnum.enumValues[number];

export const emailThread = email.table(
  'email_thread',
  {
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    id: bigint('id', { mode: 'bigint' }).notNull().generatedAlwaysAsIdentity().primaryKey(),
    draftId: bigint('draft_id', { mode: 'bigint' })
      .references(() => draft.id, { onUpdate: 'cascade' })
      .notNull(),
    eventType: inngestEventNameEnum('event_type').notNull(),
    round: smallint('round')
      .unique('unique_round', { nulls: 'not distinct' }),
    recipientUserId: ulid('recipient_user_id')
      .references(() => user.id, { onUpdate: 'cascade', onDelete: 'cascade' })
      .notNull(),
    gmailThreadId: text('gmail_thread_id').notNull(),
    gmailMessageIds: text('gmail_message_ids').array().notNull(),
    gmailMessageIdsText: text('gmail_message_ids_text')
      .generatedAlwaysAs((): SQL => sql`array_to_string(${emailThread.gmailMessageIds}, ' ')`)
      .notNull(),
  },
  ({ draftId, eventType, round, recipientUserId, gmailThreadId }) => [
    // Add unique index on draftId, event type, round, and recipient user ID
    uniqueIndex('thread_draft_event_round_lab_recipient_idx').on(draftId, eventType, round, recipientUserId),

    // Add unique index on thread ID and recipient user ID
    uniqueIndex('thread_recipient_idx').on(gmailThreadId, recipientUserId),
  ],
);
