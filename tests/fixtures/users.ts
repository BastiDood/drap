import { expect, mergeTests, type Page } from '@playwright/test';

import {
  deleteOpenIdUser,
  deleteValidSession,
  insertDummySession,
  upsertOpenIdUser,
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
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertOpenIdUser(database, 'eager.student@up.edu.ph', null, 'Eager', 'Draftee', '');
      expect(isAdmin).toBe(false);
      expect(labId).toBeNull();
      await use(userId);
      await deleteOpenIdUser(database, userId);
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
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertOpenIdUser(
        database,
        'patient.student@up.edu.ph',
        null,
        'Patient',
        'Candidate',
        '',
      );
      expect(isAdmin).toBe(false);
      expect(labId).toBeNull();
      await use(userId);
      await deleteOpenIdUser(database, userId);
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
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertOpenIdUser(
        database,
        'persistent.student@up.edu.ph',
        null,
        'Persistent',
        'Hopeful',
        '',
      );
      expect(isAdmin).toBe(false);
      expect(labId).toBeNull();
      await use(userId);
      await deleteOpenIdUser(database, userId);
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
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertOpenIdUser(
        database,
        'unlucky.student@up.edu.ph',
        null,
        'Unlucky',
        'FullRanker',
        '',
      );
      expect(isAdmin).toBe(false);
      expect(labId).toBeNull();
      await use(userId);
      await deleteOpenIdUser(database, userId);
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
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertOpenIdUser(
        database,
        'partial-drafted.student@up.edu.ph',
        null,
        'Partial',
        'ToDrafted',
        '',
      );
      expect(isAdmin).toBe(false);
      expect(labId).toBeNull();
      await use(userId);
      await deleteOpenIdUser(database, userId);
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
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertOpenIdUser(
        database,
        'partial-lottery.student@up.edu.ph',
        null,
        'Partial',
        'ToLottery',
        '',
      );
      expect(isAdmin).toBe(false);
      expect(labId).toBeNull();
      await use(userId);
      await deleteOpenIdUser(database, userId);
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
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertOpenIdUser(
        database,
        'no-rank.student@up.edu.ph',
        null,
        'NoRank',
        'Student',
        '',
      );
      expect(isAdmin).toBe(false);
      expect(labId).toBeNull();
      await use(userId);
      await deleteOpenIdUser(database, userId);
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

const testLateRegistrant = testLabs.extend<
  { lateRegistrantPage: Page },
  { lateRegistrantUserId: string }
>({
  lateRegistrantUserId: [
    async ({ database, labs: _ }, use) => {
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertOpenIdUser(
        database,
        'late.student@up.edu.ph',
        null,
        'Late',
        'Registrant',
        '',
      );
      expect(isAdmin).toBe(false);
      expect(labId).toBeNull();
      await use(userId);
      await deleteOpenIdUser(database, userId);
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

const testNdslHead = testLabs.extend<{ ndslHeadPage: Page }, { ndslHeadUserId: string }>({
  ndslHeadUserId: [
    async ({ database, labs: _ }, use) => {
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertTestUser(database, 'ndsl@up.edu.ph', 'ndsl', 'NDSL', 'Head', '');
      expect(isAdmin).toBe(true);
      expect(labId).toBe('ndsl');
      await use(userId);
      await deleteOpenIdUser(database, userId);
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
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertTestUser(database, 'csl@up.edu.ph', 'csl', 'CSL', 'Head', '');
      expect(isAdmin).toBe(true);
      expect(labId).toBe('csl');
      await use(userId);
      await deleteOpenIdUser(database, userId);
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
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertTestUser(database, 'scl@up.edu.ph', 'scl', 'SCL', 'Head', '');
      expect(isAdmin).toBe(true);
      expect(labId).toBe('scl');
      await use(userId);
      await deleteOpenIdUser(database, userId);
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
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertTestUser(database, 'cvmil@up.edu.ph', 'cvmil', 'CVMIL', 'Head', '');
      expect(isAdmin).toBe(true);
      expect(labId).toBe('cvmil');
      await use(userId);
      await deleteOpenIdUser(database, userId);
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
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertTestUser(database, 'acl@up.edu.ph', 'acl', 'ACL', 'Head', '');
      expect(isAdmin).toBe(true);
      expect(labId).toBe('acl');
      await use(userId);
      await deleteOpenIdUser(database, userId);
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
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertTestUser(database, 'admin@up.edu.ph', null, 'Draft', 'Administrator', '');
      expect(isAdmin).toBe(true);
      expect(labId).toBeNull();
      await use(userId);
      await deleteOpenIdUser(database, userId);
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
  testLateRegistrant,
  testPartialToDrafted,
  testPartialToLottery,
);
