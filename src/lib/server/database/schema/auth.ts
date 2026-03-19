import { index, pgSchema, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { user } from './app';

import { ulid } from './custom/ulid';

export const auth = pgSchema('auth');

export const session = auth.table(
  'session',
  {
    id: ulid('id')
      .notNull()
      .primaryKey()
      .default(sql`gen_ulid()`),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    expiredAt: timestamp('expired_at', { mode: 'date', withTimezone: true }).notNull(),
    userId: ulid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  table => ({
    expiredAtIdx: index('session_expired_at_idx').on(table.expiredAt),
  }),
);
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
