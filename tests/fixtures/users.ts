import { expect } from '@playwright/test';

import {
  deleteOpenIdUser,
  deleteValidSession,
  insertDummySession,
  upsertOpenIdUser,
} from '$lib/server/database/drizzle';

import { testDatabase } from './database';
import { testLabs } from './labs';

export const testStudent = testDatabase.extend<object, { studentUserId: string }>({
  studentUserId: [
    async ({ database }, use) => {
      // Create dummy user
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertOpenIdUser(database, 'student@up.edu.ph', null, 'Student', 'User', '');
      expect(isAdmin).toBe(false);
      expect(labId).toBeNull();
      await use(userId);
      await deleteOpenIdUser(database, userId);
    },
    { scope: 'worker' },
  ],
  async page({ database, context, page, studentUserId }, use) {
    const sessionId = await insertDummySession(database, studentUserId);
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
  },
});

export const testNdslHead = testLabs.extend<object, { ndslHeadUserId: string }>({
  ndslHeadUserId: [
    async ({ database, labs: _ }, use) => {
      // Create dummy user
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertOpenIdUser(database, 'ndsl@up.edu.ph', 'ndsl', 'NSDL', 'Head', '');
      expect(isAdmin).toBe(true);
      expect(labId).toBe('ndsl');
      await use(userId);
      await deleteOpenIdUser(database, userId);
    },
    { scope: 'worker' },
  ],
  async page({ database, context, page, ndslHeadUserId }, use) {
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
  },
});

export const testCslHead = testLabs.extend<object, { cslHeadUserId: string }>({
  cslHeadUserId: [
    async ({ database, labs: _ }, use) => {
      // Create dummy user
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertOpenIdUser(database, 'csl@up.edu.ph', 'csl', 'CSL', 'Head', '');
      expect(isAdmin).toBe(true);
      expect(labId).toBe('csl');
      await use(userId);
      await deleteOpenIdUser(database, userId);
    },
    { scope: 'worker' },
  ],
  async page({ database, context, page, cslHeadUserId }, use) {
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
  },
});

export const testSclHead = testLabs.extend<object, { sclHeadUserId: string }>({
  sclHeadUserId: [
    async ({ database, labs: _ }, use) => {
      // Create dummy user
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertOpenIdUser(database, 'scl@up.edu.ph', 'scl', 'SCL', 'Head', '');
      expect(isAdmin).toBe(true);
      expect(labId).toBe('scl');
      await use(userId);
      await deleteOpenIdUser(database, userId);
    },
    { scope: 'worker' },
  ],
  async page({ database, context, page, sclHeadUserId }, use) {
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
  },
});

export const testAdmin = testDatabase.extend<object, { adminUserId: string }>({
  adminUserId: [
    async ({ database }, use) => {
      // Create dummy user
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertOpenIdUser(database, 'admin@up.edu.ph', null, 'Draft', 'Administrator', '');
      expect(isAdmin).toBe(true);
      expect(labId).toBeNull();
      await use(userId);
      await deleteOpenIdUser(database, userId);
    },
    { scope: 'worker' },
  ],
  async page({ database, context, page, adminUserId }, use) {
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
  },
});
