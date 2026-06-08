import { bigint, pgSchema, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

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

export const emailThread = email.table(
  'email_thread',
  {
    // GMail thread ID
    emailThreadId: text('email_thread_id').notNull(),
    // Store the message IDs of the emails in the chain in a space-delimited string
    // Assume that the system is replying to itself
    messageIdsStr: text('message_ids_str').notNull(),
    // Scope to a draft
    draftId: bigint('draft_id', { mode: 'bigint' })
      .notNull()
      .references(() => draft.id, { onUpdate: 'cascade' }),
    // Store the subject of the original email
    emailSubject: text('email_subject').notNull(),
    recipientEmail: text('recipient_email')
      .notNull()
      .references(() => user.email, { onUpdate: 'cascade', onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  ({ draftId, emailSubject, recipientEmail }) => [
    // Make primary key for faster lookup
    primaryKey({ columns: [draftId, emailSubject, recipientEmail] }),
  ],
);
