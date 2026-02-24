import { mergeTests, type Page } from '@playwright/test';

import {
  deleteValidSession,
  insertDummySession,
  upsertTestUser,
} from '$lib/server/database/drizzle';

import { testDatabase } from './database';
import { testLabs } from './labs';

// Student fixtures with behavior-based names for E2E testing
// Each student has a specific role in the draft lifecycle tests

const testEagerDraftee = testLabs.extend<
  { eagerDrafteePage: Page },
  { eagerDrafteeUserId: string }
>({
  eagerDrafteeUserId: [
    async ({ database, labs: _ }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'eager.student@up.edu.ph',
        googleUserId: 'test-eager-student',
        givenName: 'Eager',
        familyName: 'Draftee',
        isAdmin: false,
        labId: null,
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async eagerDrafteePage({ database, browser, eagerDrafteeUserId }, use) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, eagerDrafteeUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

const testPatientCandidate = testLabs.extend<
  { patientCandidatePage: Page },
  { patientCandidateUserId: string }
>({
  patientCandidateUserId: [
    async ({ database, labs: _ }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'patient.student@up.edu.ph',
        googleUserId: 'test-patient-student',
        givenName: 'Patient',
        familyName: 'Candidate',
        isAdmin: false,
        labId: null,
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async patientCandidatePage({ database, browser, patientCandidateUserId }, use) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, patientCandidateUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

const testPersistentHopeful = testLabs.extend<
  { persistentHopefulPage: Page },
  { persistentHopefulUserId: string }
>({
  persistentHopefulUserId: [
    async ({ database, labs: _ }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'persistent.student@up.edu.ph',
        googleUserId: 'test-persistent-student',
        givenName: 'Persistent',
        familyName: 'Hopeful',
        isAdmin: false,
        labId: null,
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async persistentHopefulPage({ database, browser, persistentHopefulUserId }, use) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, persistentHopefulUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

const testUnluckyFullRanker = testLabs.extend<
  { unluckyFullRankerPage: Page },
  { unluckyFullRankerUserId: string }
>({
  unluckyFullRankerUserId: [
    async ({ database, labs: _ }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'unlucky.student@up.edu.ph',
        googleUserId: 'test-unlucky-student',
        givenName: 'Unlucky',
        familyName: 'FullRanker',
        isAdmin: false,
        labId: null,
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async unluckyFullRankerPage({ database, browser, unluckyFullRankerUserId }, use) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, unluckyFullRankerUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

const testPartialToDrafted = testLabs.extend<
  { partialToDraftedPage: Page },
  { partialToDraftedUserId: string }
>({
  partialToDraftedUserId: [
    async ({ database, labs: _ }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'partial-drafted.student@up.edu.ph',
        googleUserId: 'test-partial-drafted-student',
        givenName: 'Partial',
        familyName: 'ToDrafted',
        isAdmin: false,
        labId: null,
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async partialToDraftedPage({ database, browser, partialToDraftedUserId }, use) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, partialToDraftedUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

const testPartialToLottery = testLabs.extend<
  { partialToLotteryPage: Page },
  { partialToLotteryUserId: string }
>({
  partialToLotteryUserId: [
    async ({ database, labs: _ }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'partial-lottery.student@up.edu.ph',
        googleUserId: 'test-partial-lottery-student',
        givenName: 'Partial',
        familyName: 'ToLottery',
        isAdmin: false,
        labId: null,
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async partialToLotteryPage({ database, browser, partialToLotteryUserId }, use) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, partialToLotteryUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

const testNoRankStudent = testLabs.extend<
  { noRankStudentPage: Page },
  { noRankStudentUserId: string }
>({
  noRankStudentUserId: [
    async ({ database, labs: _ }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'no-rank.student@up.edu.ph',
        googleUserId: 'test-no-rank-student',
        givenName: 'NoRank',
        familyName: 'Student',
        isAdmin: false,
        labId: null,
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async noRankStudentPage({ database, browser, noRankStudentUserId }, use) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, noRankStudentUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

const testIdleBystander = testLabs.extend<
  { idleBystanderPage: Page },
  { idleBystanderUserId: string }
>({
  idleBystanderUserId: [
    async ({ database, labs: _ }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'idle.student@up.edu.ph',
        googleUserId: 'test-idle-student',
        givenName: 'Idle',
        familyName: 'Bystander',
        isAdmin: false,
        labId: null,
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async idleBystanderPage({ database, browser, idleBystanderUserId }, use) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, idleBystanderUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

const testLateRegistrant = testLabs.extend<
  { lateRegistrantPage: Page },
  { lateRegistrantUserId: string }
>({
  lateRegistrantUserId: [
    async ({ database, labs: _ }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'late.student@up.edu.ph',
        googleUserId: 'test-late-student',
        givenName: 'Late',
        familyName: 'Registrant',
        isAdmin: false,
        labId: null,
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async lateRegistrantPage({ database, browser, lateRegistrantUserId }, use) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, lateRegistrantUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

const testSecondRoundNdslFirstChoice = testLabs.extend<
  { secondRoundNdslFirstChoicePage: Page },
  { secondRoundNdslFirstChoiceUserId: string }
>({
  secondRoundNdslFirstChoiceUserId: [
    async ({ database, labs: _ }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'second-ndsl-first-choice.student@up.edu.ph',
        googleUserId: 'test-second-ndsl-first-choice-student',
        givenName: 'SecondNdsl',
        familyName: 'FirstChoice',
        isAdmin: false,
        labId: null,
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async secondRoundNdslFirstChoicePage(
    { database, browser, secondRoundNdslFirstChoiceUserId },
    use,
  ) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, secondRoundNdslFirstChoiceUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

const testSecondRoundCslFirstChoice = testLabs.extend<
  { secondRoundCslFirstChoicePage: Page },
  { secondRoundCslFirstChoiceUserId: string }
>({
  secondRoundCslFirstChoiceUserId: [
    async ({ database, labs: _ }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'second-csl-first-choice.student@up.edu.ph',
        googleUserId: 'test-second-csl-first-choice-student',
        givenName: 'SecondCsl',
        familyName: 'FirstChoice',
        isAdmin: false,
        labId: null,
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async secondRoundCslFirstChoicePage({ database, browser, secondRoundCslFirstChoiceUserId }, use) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, secondRoundCslFirstChoiceUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

const testSecondRoundSclSecondChoice = testLabs.extend<
  { secondRoundSclSecondChoicePage: Page },
  { secondRoundSclSecondChoiceUserId: string }
>({
  secondRoundSclSecondChoiceUserId: [
    async ({ database, labs: _ }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'second-scl-second-choice.student@up.edu.ph',
        googleUserId: 'test-second-scl-second-choice-student',
        givenName: 'SecondScl',
        familyName: 'SecondChoice',
        isAdmin: false,
        labId: null,
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async secondRoundSclSecondChoicePage(
    { database, browser, secondRoundSclSecondChoiceUserId },
    use,
  ) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, secondRoundSclSecondChoiceUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

const testSnapshotGuardStudent = testLabs.extend<
  { snapshotGuardStudentPage: Page },
  { snapshotGuardStudentUserId: string }
>({
  snapshotGuardStudentUserId: [
    async ({ database, labs: _ }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'snapshot-guard.student@up.edu.ph',
        googleUserId: 'test-snapshot-guard-student',
        givenName: 'Snapshot',
        familyName: 'Guard',
        isAdmin: false,
        labId: null,
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async snapshotGuardStudentPage({ database, browser, snapshotGuardStudentUserId }, use) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, snapshotGuardStudentUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

const testNdslHead = testLabs.extend<{ ndslHeadPage: Page }, { ndslHeadUserId: string }>({
  ndslHeadUserId: [
    async ({ database, labs: _ }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'ndsl@up.edu.ph',
        googleUserId: 'test-ndsl-head',
        givenName: 'NDSL',
        familyName: 'Head',
        isAdmin: true,
        labId: 'ndsl',
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async ndslHeadPage({ database, browser, ndslHeadUserId }, use) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, ndslHeadUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

const testCslHead = testLabs.extend<{ cslHeadPage: Page }, { cslHeadUserId: string }>({
  cslHeadUserId: [
    async ({ database, labs: _ }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'csl@up.edu.ph',
        googleUserId: 'test-csl-head',
        givenName: 'CSL',
        familyName: 'Head',
        isAdmin: true,
        labId: 'csl',
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async cslHeadPage({ database, browser, cslHeadUserId }, use) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, cslHeadUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

const testSclHead = testLabs.extend<{ sclHeadPage: Page }, { sclHeadUserId: string }>({
  sclHeadUserId: [
    async ({ database, labs: _ }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'scl@up.edu.ph',
        googleUserId: 'test-scl-head',
        givenName: 'SCL',
        familyName: 'Head',
        isAdmin: true,
        labId: 'scl',
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async sclHeadPage({ database, browser, sclHeadUserId }, use) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, sclHeadUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

const testCvmilHead = testLabs.extend<{ cvmilHeadPage: Page }, { cvmilHeadUserId: string }>({
  cvmilHeadUserId: [
    async ({ database, labs: _ }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'cvmil@up.edu.ph',
        googleUserId: 'test-cvmil-head',
        givenName: 'CVMIL',
        familyName: 'Head',
        isAdmin: true,
        labId: 'cvmil',
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async cvmilHeadPage({ database, browser, cvmilHeadUserId }, use) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, cvmilHeadUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

const testAclHead = testLabs.extend<{ aclHeadPage: Page }, { aclHeadUserId: string }>({
  aclHeadUserId: [
    async ({ database, labs: _ }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'acl@up.edu.ph',
        googleUserId: 'test-acl-head',
        givenName: 'ACL',
        familyName: 'Head',
        isAdmin: true,
        labId: 'acl',
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async aclHeadPage({ database, browser, aclHeadUserId }, use) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, aclHeadUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

const testAdmin = testDatabase.extend<{ adminPage: Page }, { adminUserId: string }>({
  adminUserId: [
    async ({ database }, use) => {
      const { id: userId } = await upsertTestUser(database, {
        email: 'admin@up.edu.ph',
        googleUserId: 'test-admin',
        givenName: 'Draft',
        familyName: 'Administrator',
        isAdmin: true,
        labId: null,
      });
      await use(userId);
    },
    { scope: 'worker' },
  ],
  async adminPage({ database, browser, adminUserId }, use) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = await insertDummySession(database, adminUserId);
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
    await deleteValidSession(database, sessionId);
    await context.close();
  },
});

export const test = mergeTests(
  testAdmin,
  testNdslHead,
  testCslHead,
  testSclHead,
  testCvmilHead,
  testAclHead,
  testEagerDraftee,
  testPatientCandidate,
  testPersistentHopeful,
  testUnluckyFullRanker,
  testNoRankStudent,
  testIdleBystander,
  testLateRegistrant,
  testSecondRoundNdslFirstChoice,
  testSecondRoundCslFirstChoice,
  testSecondRoundSclSecondChoice,
  testSnapshotGuardStudent,
  testPartialToDrafted,
  testPartialToLottery,
);
