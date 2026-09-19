import { relations } from 'drizzle-orm';

import { user } from './app';
import { session } from './auth';
import { gmailThread } from './email';

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  gmailThreads: many(gmailThread),
}));

export const gmailThreadRelations = relations(gmailThread, ({ one }) => ({
  recipient: one(user, { fields: [gmailThread.recipientUserId], references: [user.id] }),
}));
