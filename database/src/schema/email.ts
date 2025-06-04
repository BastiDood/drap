import { pgSchema, text, timestamp } from 'drizzle-orm/pg-core';

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
    expiration: timestamp('expiration', { mode: 'date' }).notNull(),
});

export const designatedSender = email.table('designated_sender', {
    // Referencing the candidate sender table ensures that the user is not just any arbitrary user.
    candidateSenderId: ulid('user_id')
        .notNull()
        .references(() => candidateSender.userId, { onUpdate: 'cascade', onDelete: 'cascade' })
        .primaryKey(),
});
