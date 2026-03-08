import { pgSchema, text, timestamp } from 'drizzle-orm/pg-core';

import { user } from './app';

import { bytea } from './custom/bytea';
import { ulid } from './custom/ulid';

export const email = pgSchema('email');

export const candidateSender = email.table('candidate_sender', {
  userId: ulid('user_id')
    .notNull()
    .references(() => user.id, { onUpdate: 'cascade', onDelete: 'cascade' })
    .primaryKey(),
  scopes: text('scopes').array().notNull().default([]),
  expiration: timestamp('expiration', { mode: 'date', withTimezone: true }).notNull(),
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
