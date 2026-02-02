import { expect, test } from '@playwright/test';

import { db } from '$lib/server/database';
import {
  deleteOpenIdUser,
  deleteValidSession,
  insertDummySession,
  upsertOpenIdUser,
} from '$lib/server/database/drizzle';

import { testLabs } from './labs';

export const testStudent = test.extend<object, { studentUserId: string }>({
  studentUserId: [
    async (_, use) => {
      // Create dummy user
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertOpenIdUser(db, 'student@up.edu.ph', null, 'Student', 'User', '');
      expect(isAdmin).toBe(false);
      expect(labId).toBeNull();
      await use(userId);
      await deleteOpenIdUser(db, userId);
    },
    { scope: 'worker' },
  ],
  async page({ context, page, studentUserId }, use) {
    const sessionId = await insertDummySession(db, studentUserId);
    await context.addCookies([
      {
        name: 'sid',
        value: sessionId,
        path: '/dashboard',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    await page.goto('/dashboard/');
    await use(page);
    await deleteValidSession(db, sessionId);
  },
});

export const testNdslHead = testLabs.extend<object, { ndslHeadUserId: string }>({
  ndslHeadUserId: [
    async ({ labs: _ }, use) => {
      // Create dummy user
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertOpenIdUser(db, 'ndsl@up.edu.ph', 'ndsl', 'NSDL', 'Head', '');
      expect(isAdmin).toBe(true);
      expect(labId).toBe('ndsl');
      await use(userId);
      await deleteOpenIdUser(db, userId);
    },
    { scope: 'worker' },
  ],
  async page({ context, page, ndslHeadUserId }, use) {
    const sessionId = await insertDummySession(db, ndslHeadUserId);
    await context.addCookies([
      {
        name: 'sid',
        value: sessionId,
        path: '/dashboard',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    await page.goto('/dashboard/');
    await use(page);
    await deleteValidSession(db, sessionId);
  },
});

export const testCslHead = testLabs.extend<object, { cslHeadUserId: string }>({
  cslHeadUserId: [
    async ({ labs: _ }, use) => {
      // Create dummy user
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertOpenIdUser(db, 'csl@up.edu.ph', 'csl', 'CSL', 'Head', '');
      expect(isAdmin).toBe(true);
      expect(labId).toBe('csl');
      await use(userId);
      await deleteOpenIdUser(db, userId);
    },
    { scope: 'worker' },
  ],
  async page({ context, page, cslHeadUserId }, use) {
    const sessionId = await insertDummySession(db, cslHeadUserId);
    await context.addCookies([
      {
        name: 'sid',
        value: sessionId,
        path: '/dashboard',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    await page.goto('/dashboard/');
    await use(page);
    await deleteValidSession(db, sessionId);
  },
});

export const testSclHead = testLabs.extend<object, { sclHeadUserId: string }>({
  sclHeadUserId: [
    async ({ labs: _ }, use) => {
      // Create dummy user
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertOpenIdUser(db, 'scl@up.edu.ph', 'scl', 'SCL', 'Head', '');
      expect(isAdmin).toBe(true);
      expect(labId).toBe('scl');
      await use(userId);
      await deleteOpenIdUser(db, userId);
    },
    { scope: 'worker' },
  ],
  async page({ context, page, sclHeadUserId }, use) {
    const sessionId = await insertDummySession(db, sclHeadUserId);
    await context.addCookies([
      {
        name: 'sid',
        value: sessionId,
        path: '/dashboard',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    await page.goto('/dashboard/');
    await use(page);
    await deleteValidSession(db, sessionId);
  },
});

export const testAdmin = test.extend<object, { adminUserId: string }>({
  adminUserId: [
    async (_, use) => {
      // Create dummy user
      const {
        id: userId,
        isAdmin,
        labId,
      } = await upsertOpenIdUser(db, 'admin@up.edu.ph', null, 'Draft', 'Administrator', '');
      expect(isAdmin).toBe(true);
      expect(labId).toBeNull();
      await use(userId);
      await deleteOpenIdUser(db, userId);
    },
    { scope: 'worker' },
  ],
  async page({ context, page, adminUserId }, use) {
    const sessionId = await insertDummySession(db, adminUserId);
    await context.addCookies([
      {
        name: 'sid',
        value: sessionId,
        path: '/dashboard',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    await page.goto('/dashboard/');
    await use(page);
    await deleteValidSession(db, sessionId);
  },
});
