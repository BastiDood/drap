import {
  bigint,
  boolean,
  check,
  foreignKey,
  pgSchema,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { tstzrange } from './custom/tstzrange';
import { ulid } from './custom/ulid';

export const app = pgSchema('drap');

export const lab = app.table(
  'lab',
  {
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    id: text('lab_id').primaryKey().notNull(),
    name: text('lab_name').unique().notNull(),
    quota: smallint('quota').notNull().default(0),
  },
  ({ quota }) => [check('lab_quota_non_negative_check', sql`${quota} >= 0`)],
);
export type Lab = typeof lab.$inferSelect;
export type NewLab = typeof lab.$inferInsert;

// match is_admin, user_id, lab_id:
//     case FALSE, NULL, NULL: Invited User
//     case FALSE, NULL, _:    Invited Researcher
//     case FALSE, _, NULL:    Registered User
//     case FALSE, _, _:       Drafted Researcher
//     case TRUE, NULL, NULL:  Invited Admin
//     case TRUE, NULL, _:     Invited Faculty
//     case TRUE, _, NULL:     Registered Admin
//     case TRUE, _, _:        Registered Faculty
export const user = app.table(
  'user',
  {
    id: ulid('id')
      .primaryKey()
      .notNull()
      .default(sql`gen_ulid()`),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    studentNumber: bigint('student_number', { mode: 'bigint' }).unique(),
    isAdmin: boolean('is_admin').notNull().default(false),
    googleUserId: text('google_user_id').unique(),
    labId: text('lab_id').references(() => lab.id, { onUpdate: 'cascade' }),
    email: text('email').notNull().unique(),
    givenName: text('given_name').notNull().default(''),
    familyName: text('family_name').notNull().default(''),
    avatarUrl: text('avatar').notNull().default(''),
  },
  ({ email, studentNumber }) => [
    check(
      'user_student_number_within_bounds',
      sql`${studentNumber} BETWEEN 100000000 AND 1000000000`,
    ),
    check('user_email_non_empty', sql`${email} <> ''`),
  ],
);
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export const draft = app.table(
  'draft',
  {
    id: bigint('id', { mode: 'bigint' }).notNull().generatedAlwaysAsIdentity().primaryKey(),
    currRound: smallint('curr_round').default(0),
    maxRounds: smallint('max_rounds').notNull(),
    activePeriod: tstzrange('active_period')
      .notNull()
      .default(sql`tstzrange(now(), null, '[)')`),
  },
  ({ currRound, maxRounds }) => [
    check('draft_curr_round_within_bounds', sql`${currRound} BETWEEN 0 AND ${maxRounds}`),
    // TODO: Exclusive index range for `activePeriod`.
  ],
);
export type Draft = typeof draft.$inferSelect;
export type NewDraft = typeof draft.$inferInsert;

export const studentRank = app.table(
  'student_rank',
  {
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    draftId: bigint('draft_id', { mode: 'bigint' })
      .notNull()
      .references(() => draft.id, { onUpdate: 'cascade' }),
    userId: ulid('user_id')
      .notNull()
      .references(() => user.id, { onUpdate: 'cascade' }),
  },
  ({ draftId, userId }) => [primaryKey({ columns: [draftId, userId] })],
);
export type StudentRank = typeof studentRank.$inferSelect;
export type NewStudentRank = typeof studentRank.$inferInsert;

export const studentRankLab = app.table(
  'student_rank_lab',
  {
    draftId: bigint('draft_id', { mode: 'bigint' })
      .notNull()
      .references(() => draft.id, { onUpdate: 'cascade' }),
    userId: ulid('user_id')
      .notNull()
      .references(() => user.id, { onUpdate: 'cascade' }),
    labId: text('lab_id')
      .notNull()
      .references(() => lab.id, { onUpdate: 'cascade' }),
    index: bigint('index', { mode: 'bigint' }).notNull(),
    remark: varchar('remark', { length: 1028 }).notNull().default(''),
  },
  ({ draftId, userId, labId }) => [primaryKey({ columns: [draftId, userId, labId] })],
);
export type StudentRankLab = typeof studentRankLab.$inferSelect;
export type NewStudentRankLab = typeof studentRankLab.$inferInsert;

export const facultyChoice = app.table(
  'faculty_choice',
  {
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    draftId: bigint('draft_id', { mode: 'bigint' })
      .notNull()
      .references(() => draft.id, { onUpdate: 'cascade' }),
    round: smallint('round'),
    labId: text('lab_id')
      .notNull()
      .references(() => lab.id, { onUpdate: 'cascade' }),
    // Possibly `null` to model the fact that faculty choices can be automated by the system.
    userId: ulid('user_id').references(() => user.id, { onUpdate: 'cascade' }),
  },
  ({ draftId, round, labId }) => [
    check('faculty_choice_post_registration_round_check', sql`${round} > 0`),
    unique('faculty_choice_only_once_per_draft_round').on(draftId, round, labId).nullsNotDistinct(),
  ],
);
export type FacultyChoice = typeof facultyChoice.$inferSelect;
export type NewFacultyChoice = typeof facultyChoice.$inferInsert;

export const facultyChoiceUser = app.table(
  'faculty_choice_user',
  {
    facultyUserId: ulid('faculty_user_id')
      .notNull()
      .references(() => user.id, { onUpdate: 'cascade' }),
    studentUserId: ulid('student_user_id')
      .notNull()
      .references(() => user.id, { onUpdate: 'cascade' }),
    draftId: bigint('draft_id', { mode: 'bigint' })
      .notNull()
      .references(() => draft.id, { onUpdate: 'cascade' }),
    round: smallint('round'),
    labId: text('lab_id')
      .notNull()
      .references(() => lab.id, { onUpdate: 'cascade' }),
  },
  ({ draftId, round, labId, studentUserId, facultyUserId }) => [
    foreignKey({
      columns: [draftId, round, labId],
      foreignColumns: [facultyChoice.draftId, facultyChoice.round, facultyChoice.labId],
    }),
    unique('faculty_choice_user_unique_student_selection_per_draft').on(draftId, studentUserId),
    check(
      'faculty_choice_user_different_student_and_faculty_users',
      sql`${studentUserId} <> ${facultyUserId}`,
    ),
  ],
);
export type FacultyChoiceUser = typeof facultyChoiceUser.$inferSelect;
export type NewFacultyChoiceUser = typeof facultyChoiceUser.$inferInsert;
