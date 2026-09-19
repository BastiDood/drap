import { assertSingle } from '$lib/server/assert';
import {
  type DbConnection,
  type DrizzleDatabase,
  deleteValidSession,
  insertDummySession,
} from '$lib/server/database/drizzle';
import * as schema from '$lib/server/database/schema';
import type { Browser, Page } from '@playwright/test';
import { eq, sql } from 'drizzle-orm';

import { testDatabase } from './database';

interface E2eUser {
  email: string;
  googleUserId: string;
  givenName: string;
  familyName: string;
  avatarUrl: string;
  isAdmin: boolean;
  labId: 'ndsl' | 'csl' | 'scl' | 'cvmil' | 'acl' | null;
}

interface UserIdFixtures {
  eagerDrafteeUserId: string;
  patientCandidateUserId: string;
  persistentHopefulUserId: string;
  unluckyFullRankerUserId: string;
  partialToDraftedUserId: string;
  partialToLotteryUserId: string;
  noRankStudentUserId: string;
  idleBystanderUserId: string;
  lateRegistrantUserId: string;
  secondRoundNdslFirstChoiceUserId: string;
  secondRoundCslFirstChoiceUserId: string;
  secondRoundSclSecondChoiceUserId: string;
  snapshotGuardStudentUserId: string;
  repeatDrafteeUserId: string;
  ndslHeadUserId: string;
  cslHeadUserId: string;
  sclHeadUserId: string;
  cvmilHeadUserId: string;
  aclHeadUserId: string;
  adminEmail: string;
  adminUserId: string;
  secondAdminUserId: string;
}

interface UserPageFixtures {
  eagerDrafteePage: Page;
  patientCandidatePage: Page;
  persistentHopefulPage: Page;
  unluckyFullRankerPage: Page;
  partialToDraftedPage: Page;
  partialToLotteryPage: Page;
  noRankStudentPage: Page;
  idleBystanderPage: Page;
  lateRegistrantPage: Page;
  secondRoundNdslFirstChoicePage: Page;
  secondRoundCslFirstChoicePage: Page;
  secondRoundSclSecondChoicePage: Page;
  snapshotGuardStudentPage: Page;
  repeatDrafteePage: Page;
  ndslHeadPage: Page;
  cslHeadPage: Page;
  sclHeadPage: Page;
  cvmilHeadPage: Page;
  aclHeadPage: Page;
  adminPage: Page;
  secondAdminPage: Page;
}

export const e2eUsers = {
  eagerDraftee: {
    email: 'eager.student@up.edu.ph',
    googleUserId: 'test-eager-student',
    givenName: 'Eager',
    familyName: 'Draftee',
    avatarUrl: 'https://avatar.vercel.sh/eager.svg',
    isAdmin: false,
    labId: null,
  },
  patientCandidate: {
    email: 'patient.student@up.edu.ph',
    googleUserId: 'test-patient-student',
    givenName: 'Patient',
    familyName: 'Candidate',
    avatarUrl: '',
    isAdmin: false,
    labId: null,
  },
  persistentHopeful: {
    email: 'persistent.student@up.edu.ph',
    googleUserId: 'test-persistent-student',
    givenName: 'Persistent',
    familyName: 'Hopeful',
    avatarUrl: '',
    isAdmin: false,
    labId: null,
  },
  unluckyFullRanker: {
    email: 'unlucky.student@up.edu.ph',
    googleUserId: 'test-unlucky-student',
    givenName: 'Unlucky',
    familyName: 'FullRanker',
    avatarUrl: 'https://avatar.vercel.sh/unlucky.svg',
    isAdmin: false,
    labId: null,
  },
  partialToDrafted: {
    email: 'partial-drafted.student@up.edu.ph',
    googleUserId: 'test-partial-drafted-student',
    givenName: 'Partial',
    familyName: 'ToDrafted',
    avatarUrl: 'https://avatar.vercel.sh/partial-drafted.svg',
    isAdmin: false,
    labId: null,
  },
  partialToLottery: {
    email: 'partial-lottery.student@up.edu.ph',
    googleUserId: 'test-partial-lottery-student',
    givenName: 'Partial',
    familyName: 'ToLottery',
    avatarUrl: '',
    isAdmin: false,
    labId: null,
  },
  noRankStudent: {
    email: 'no-rank.student@up.edu.ph',
    googleUserId: 'test-no-rank-student',
    givenName: 'NoRank',
    familyName: 'Student',
    avatarUrl: '',
    isAdmin: false,
    labId: null,
  },
  idleBystander: {
    email: 'idle.student@up.edu.ph',
    googleUserId: 'test-idle-student',
    givenName: 'Idle',
    familyName: 'Bystander',
    avatarUrl: '',
    isAdmin: false,
    labId: null,
  },
  lateRegistrant: {
    email: 'late.student@up.edu.ph',
    googleUserId: 'test-late-student',
    givenName: 'Late',
    familyName: 'Registrant',
    avatarUrl: '',
    isAdmin: false,
    labId: null,
  },
  secondRoundNdslFirstChoice: {
    email: 'second-ndsl-first-choice.student@up.edu.ph',
    googleUserId: 'test-second-ndsl-first-choice-student',
    givenName: 'SecondNdsl',
    familyName: 'FirstChoice',
    avatarUrl: 'https://avatar.vercel.sh/second-ndsl.svg',
    isAdmin: false,
    labId: null,
  },
  secondRoundCslFirstChoice: {
    email: 'second-csl-first-choice.student@up.edu.ph',
    googleUserId: 'test-second-csl-first-choice-student',
    givenName: 'SecondCsl',
    familyName: 'FirstChoice',
    avatarUrl: '',
    isAdmin: false,
    labId: null,
  },
  secondRoundSclSecondChoice: {
    email: 'second-scl-second-choice.student@up.edu.ph',
    googleUserId: 'test-second-scl-second-choice-student',
    givenName: 'SecondScl',
    familyName: 'SecondChoice',
    avatarUrl: 'https://avatar.vercel.sh/second-scl.svg',
    isAdmin: false,
    labId: null,
  },
  snapshotGuardStudent: {
    email: 'snapshot-guard.student@up.edu.ph',
    googleUserId: 'test-snapshot-guard-student',
    givenName: 'Snapshot',
    familyName: 'Guard',
    avatarUrl: '',
    isAdmin: false,
    labId: null,
  },
  repeatDraftee: {
    email: 'repeat.student@up.edu.ph',
    googleUserId: 'test-repeat-student',
    givenName: 'Repeat',
    familyName: 'Draftee',
    avatarUrl: 'https://avatar.vercel.sh/repeat.svg',
    isAdmin: false,
    labId: null,
  },
  ndslHead: {
    email: 'ndsl@up.edu.ph',
    googleUserId: 'test-ndsl-head',
    givenName: 'NDSL',
    familyName: 'Head',
    avatarUrl: '',
    isAdmin: true,
    labId: 'ndsl',
  },
  cslHead: {
    email: 'csl@up.edu.ph',
    googleUserId: 'test-csl-head',
    givenName: 'CSL',
    familyName: 'Head',
    avatarUrl: '',
    isAdmin: true,
    labId: 'csl',
  },
  sclHead: {
    email: 'scl@up.edu.ph',
    googleUserId: 'test-scl-head',
    givenName: 'SCL',
    familyName: 'Head',
    avatarUrl: '',
    isAdmin: true,
    labId: 'scl',
  },
  cvmilHead: {
    email: 'cvmil@up.edu.ph',
    googleUserId: 'test-cvmil-head',
    givenName: 'CVMIL',
    familyName: 'Head',
    avatarUrl: '',
    isAdmin: true,
    labId: 'cvmil',
  },
  aclHead: {
    email: 'acl@up.edu.ph',
    googleUserId: 'test-acl-head',
    givenName: 'ACL',
    familyName: 'Head',
    avatarUrl: '',
    isAdmin: true,
    labId: 'acl',
  },
  admin: {
    email: 'admin@up.edu.ph',
    googleUserId: 'test-admin',
    givenName: 'Draft',
    familyName: 'Administrator',
    avatarUrl: '',
    isAdmin: true,
    labId: null,
  },
  secondAdmin: {
    email: 'second.admin@up.edu.ph',
    googleUserId: 'test-second-admin',
    givenName: 'Second',
    familyName: 'Administrator',
    avatarUrl: '',
    isAdmin: true,
    labId: null,
  },
} satisfies Record<string, E2eUser>;

export async function seedE2eUsers(database: DbConnection) {
  await database.insert(schema.user).values(Object.values(e2eUsers));
}

async function lookupE2eUserId(database: DrizzleDatabase, email: string) {
  return await database
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.email, email))
    .then(assertSingle);
}

async function useAuthenticatedDashboardPage(
  database: DrizzleDatabase,
  browser: Browser,
  userId: string,
  use: (page: Page) => Promise<void>,
) {
  const context = await browser.newContext();
  try {
    const sessionId = await insertDummySession(database, userId);
    try {
      const page = await context.newPage();
      await context.addCookies([
        {
          name: 'sid',
          value: sessionId,
          domain: 'localhost',
          path: '/dashboard',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);
      await page.goto('/dashboard/');
      await use(page);
    } finally {
      await deleteValidSession(database, sessionId);
    }
  } finally {
    await context.close();
  }
}

const testUsers = testDatabase.extend<UserPageFixtures, UserIdFixtures>({
  eagerDrafteeUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.eagerDraftee.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  patientCandidateUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.patientCandidate.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  persistentHopefulUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.persistentHopeful.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  unluckyFullRankerUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.unluckyFullRanker.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  partialToDraftedUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.partialToDrafted.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  partialToLotteryUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.partialToLottery.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  noRankStudentUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.noRankStudent.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  idleBystanderUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.idleBystander.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  lateRegistrantUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.lateRegistrant.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  secondRoundNdslFirstChoiceUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.secondRoundNdslFirstChoice.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  secondRoundCslFirstChoiceUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.secondRoundCslFirstChoice.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  secondRoundSclSecondChoiceUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.secondRoundSclSecondChoice.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  snapshotGuardStudentUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.snapshotGuardStudent.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  repeatDrafteeUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.repeatDraftee.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  ndslHeadUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.ndslHead.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  cslHeadUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.cslHead.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  sclHeadUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.sclHead.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  cvmilHeadUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.cvmilHead.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  aclHeadUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.aclHead.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  adminEmail: [e2eUsers.admin.email, { scope: 'worker' }],
  adminUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.admin.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  secondAdminUserId: [
    async ({ database }, use) => {
      const { id } = await lookupE2eUserId(database, e2eUsers.secondAdmin.email);
      await use(id);
    },
    { scope: 'worker' },
  ],
  async eagerDrafteePage({ database, browser, eagerDrafteeUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, eagerDrafteeUserId, use);
  },
  async patientCandidatePage({ database, browser, patientCandidateUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, patientCandidateUserId, use);
  },
  async persistentHopefulPage({ database, browser, persistentHopefulUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, persistentHopefulUserId, use);
  },
  async unluckyFullRankerPage({ database, browser, unluckyFullRankerUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, unluckyFullRankerUserId, use);
  },
  async partialToDraftedPage({ database, browser, partialToDraftedUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, partialToDraftedUserId, use);
  },
  async partialToLotteryPage({ database, browser, partialToLotteryUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, partialToLotteryUserId, use);
  },
  async noRankStudentPage({ database, browser, noRankStudentUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, noRankStudentUserId, use);
  },
  async idleBystanderPage({ database, browser, idleBystanderUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, idleBystanderUserId, use);
  },
  async lateRegistrantPage({ database, browser, lateRegistrantUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, lateRegistrantUserId, use);
  },
  async secondRoundNdslFirstChoicePage(
    { database, browser, secondRoundNdslFirstChoiceUserId },
    use,
  ) {
    await useAuthenticatedDashboardPage(database, browser, secondRoundNdslFirstChoiceUserId, use);
  },
  async secondRoundCslFirstChoicePage({ database, browser, secondRoundCslFirstChoiceUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, secondRoundCslFirstChoiceUserId, use);
  },
  async secondRoundSclSecondChoicePage(
    { database, browser, secondRoundSclSecondChoiceUserId },
    use,
  ) {
    await useAuthenticatedDashboardPage(database, browser, secondRoundSclSecondChoiceUserId, use);
  },
  async snapshotGuardStudentPage({ database, browser, snapshotGuardStudentUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, snapshotGuardStudentUserId, use);
  },
  async repeatDrafteePage({ database, browser, repeatDrafteeUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, repeatDrafteeUserId, use);
  },
  async ndslHeadPage({ database, browser, ndslHeadUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, ndslHeadUserId, use);
  },
  async cslHeadPage({ database, browser, cslHeadUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, cslHeadUserId, use);
  },
  async sclHeadPage({ database, browser, sclHeadUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, sclHeadUserId, use);
  },
  async cvmilHeadPage({ database, browser, cvmilHeadUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, cvmilHeadUserId, use);
  },
  async aclHeadPage({ database, browser, aclHeadUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, aclHeadUserId, use);
  },
  async adminPage({ database, browser, adminUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, adminUserId, use);
  },
  async secondAdminPage({ database, browser, secondAdminUserId }, use) {
    await useAuthenticatedDashboardPage(database, browser, secondAdminUserId, use);
  },
});

export const test = testUsers.extend<{ seededCandidateSender: string }>({
  async seededCandidateSender({ adminUserId, database }, use) {
    await database.insert(schema.candidateSender).values({
      userId: adminUserId,
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
      expiredAt: sql`now() + interval '1 hour'`,
      accessTokenIv: sql`''::bytea`,
      accessTokenCipher: sql`''::bytea`,
      refreshTokenIv: sql`''::bytea`,
      refreshTokenCipher: sql`''::bytea`,
    });
    try {
      await use(adminUserId);
    } finally {
      await database
        .delete(schema.candidateSender)
        .where(eq(schema.candidateSender.userId, adminUserId));
    }
  },
});
