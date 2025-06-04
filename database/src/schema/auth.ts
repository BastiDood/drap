import { boolean, pgSchema, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { bytea } from './custom/bytea';
import { ulid } from './custom/ulid';

import { user } from './app';

export const auth = pgSchema('auth');

export const pending = auth.table('pending', {
    id: ulid('id')
        .notNull()
        .primaryKey()
        .default(sql`gen_random_ulid()`),
    expiration: timestamp('expiration', { mode: 'date' })
        .notNull()
        .default(sql`NOW() + INTERVAL '15 minutes'`),
    nonce: bytea('nonce')
        .notNull()
        .default(sql`gen_random_bytes(64)`),
    hasExtendedScope: boolean('has_extended_scope').notNull(),
});

export const session = auth.table('session', {
    id: ulid('id').notNull().primaryKey(),
    expiration: timestamp('expiration', { mode: 'date' }).notNull(),
    userId: ulid('user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
});
