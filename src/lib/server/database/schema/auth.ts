import { boolean, pgSchema, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { user } from './app';

import { bytea } from './custom/bytea';
import { ulid } from './custom/ulid';

export const auth = pgSchema('auth');

export const pending = auth.table('pending', {
  id: ulid('id')
    .notNull()
    .primaryKey()
    .default(sql`gen_ulid()`),
  expiration: timestamp('expiration', { mode: 'date', withTimezone: true })
    .notNull()
    .default(sql`now() + INTERVAL '15 minutes'`),
  nonce: bytea('nonce')
    .notNull()
    .default(sql`gen_random_bytes(64)`),
  hasExtendedScope: boolean('has_extended_scope').notNull(),
});
export type Pending = typeof pending.$inferSelect;
export type NewPending = typeof pending.$inferInsert;

export const session = auth.table('session', {
  id: ulid('id')
    .notNull()
    .primaryKey()
    .default(sql`gen_ulid()`),
  expiration: timestamp('expiration', { mode: 'date', withTimezone: true }).notNull(),
  userId: ulid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
