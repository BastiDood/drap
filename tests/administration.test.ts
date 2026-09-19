import { expect, type Locator } from '@playwright/test';

import { test } from './fixtures/users';

function getDraftAdminRow(card: Locator, email: string) {
  return card.getByRole('link', { name: email }).locator('xpath=ancestor::li[1]');
}
test(
  'Administrators see their controls and sender warning',
  { tag: '@initial' },
  async ({ adminPage }) => {
    await test.step('users page renders the Draft Administrators card with a timeline', async () => {
      await adminPage.goto('/dashboard/users/');
      const card = adminPage.locator('#draft-admins');
      await expect(card).toBeVisible();
      await expect(card.getByText('Draft Administrators', { exact: true })).toBeVisible();
      await expect(card.getByText('Volunteer Candidate Senders')).toBeVisible();
      await expect(card.getByText('Designate a Sender')).toBeVisible();
    });
    await test.step('admin sees the Volunteer button only on their own row', async () => {
      await adminPage.goto('/dashboard/users/#draft-admins');
      const card = adminPage.locator('#draft-admins');
      const volunteerButtons = card.getByRole('button', { name: 'Volunteer as Candidate Sender' });
      await expect(volunteerButtons).toHaveCount(1);
    });
    await test.step('hash anchor scrolls the Draft Administrators card into view', async () => {
      await adminPage.goto('/dashboard/users/#draft-admins');
      await expect(adminPage.locator('#draft-admins')).toBeInViewport();
    });
    await test.step('draft layout warns destructively when no candidate senders exist', async () => {
      await adminPage.goto('/dashboard/drafts/');
      const callout = adminPage.locator('[role="alert"][data-variant="destructive"]');
      await expect(callout).toBeVisible();
      await expect(callout).toContainText(/volunteer a candidate sender/iu);
    });
  },
);
test.describe('Candidate senders', () => {
  test.describe.configure({ mode: 'serial' });
  test(
    'seeded candidate flips the draft callout to a warning',
    { tag: '@administration' },
    async ({ adminPage, seededCandidateSender: _seeded }) => {
      await test.step('seeded candidate flips the draft callout to a warning', async () => {
        await adminPage.goto('/dashboard/drafts/');
        const callout = adminPage.locator('[role="alert"][data-variant="warning"]');
        await expect(callout).toBeVisible();
        await expect(callout).toContainText(/promote a designated sender/iu);
      });
    },
  );
  test(
    'promote flips row badge to Designated Sender',
    { tag: '@administration' },
    async ({ adminEmail, adminPage, seededCandidateSender: _seeded }) => {
      await test.step('promote flips row badge to Designated Sender', async () => {
        await adminPage.goto('/dashboard/users/#draft-admins');
        const card = adminPage.locator('#draft-admins');
        const row = getDraftAdminRow(card, adminEmail);
        await expect(row.getByText('Candidate Sender', { exact: true })).toBeVisible();
        await row.getByRole('button', { name: 'Promote', exact: true }).click();
        await expect(row.getByText('Designated Sender', { exact: true })).toBeVisible();
      });
    },
  );
  test(
    'promoted sender shows info callout on draft layout',
    { tag: '@administration' },
    async ({ adminEmail, adminPage, seededCandidateSender: _seeded }) => {
      await test.step('promoted sender shows info callout on draft layout', async () => {
        await adminPage.goto('/dashboard/users/#draft-admins');
        const card = adminPage.locator('#draft-admins');
        const row = getDraftAdminRow(card, adminEmail);
        await row.getByRole('button', { name: 'Promote', exact: true }).click();
        await expect(row.getByText('Designated Sender', { exact: true })).toBeVisible();
        await adminPage.goto('/dashboard/drafts/');
        const callout = adminPage.locator('[role="alert"][data-variant="info"]');
        await expect(callout).toBeVisible();
        await expect(callout).toContainText(/currently designated email sender/iu);
      });
    },
  );
  test(
    'demote reverts a Designated sender back to Candidate',
    { tag: '@administration' },
    async ({ adminEmail, adminPage, seededCandidateSender: _seeded }) => {
      await test.step('demote reverts a Designated sender back to Candidate', async () => {
        await adminPage.goto('/dashboard/users/#draft-admins');
        const card = adminPage.locator('#draft-admins');
        const row = getDraftAdminRow(card, adminEmail);
        await row.getByRole('button', { name: 'Promote', exact: true }).click();
        await expect(row.getByText('Designated Sender', { exact: true })).toBeVisible();
        await row.getByRole('button', { name: 'Demote', exact: true }).click();
        await expect(row.getByText('Candidate Sender', { exact: true })).toBeVisible();
      });
    },
  );
  test(
    'remove drops a Candidate back to the volunteer state',
    { tag: '@administration' },
    async ({ adminEmail, adminPage, seededCandidateSender: _seeded }) => {
      await test.step('remove drops a Candidate back to the volunteer state', async () => {
        await adminPage.goto('/dashboard/users/#draft-admins');
        const card = adminPage.locator('#draft-admins');
        const row = getDraftAdminRow(card, adminEmail);
        await expect(row.getByText('Candidate Sender', { exact: true })).toBeVisible();
        await row.getByRole('button', { name: 'Remove', exact: true }).click();
        await expect(row.getByText('Candidate Sender', { exact: true })).toHaveCount(0);
        await expect(
          card.getByRole('button', { name: 'Volunteer as Candidate Sender' }),
        ).toBeVisible();
      });
    },
  );
  test(
    'second admin can promote the first admin candidate',
    { tag: '@administration' },
    async ({ adminEmail, secondAdminPage, seededCandidateSender: _seeded }) => {
      await test.step('second admin can promote the first admin candidate', async () => {
        await secondAdminPage.goto('/dashboard/users/#draft-admins');
        const card = secondAdminPage.locator('#draft-admins');
        const row = getDraftAdminRow(card, adminEmail);
        await row.getByRole('button', { name: 'Promote', exact: true }).click();
        await expect(row.getByText('Designated Sender', { exact: true })).toBeVisible();
      });
    },
  );
});
test(
  'Lab heads can be demoted and invited again',
  { tag: '@administration' },
  async ({ adminPage, ndslHeadUserId, adminUserId }) => {
    await test.step('lab head card shows demote button for each lab head', async () => {
      await adminPage.goto('/dashboard/users/');
      await expect(adminPage.getByRole('button', { name: 'Demote', exact: true })).toHaveCount(5);
    });
    await test.step('demote removes a lab head from the section', async () => {
      await adminPage.goto('/dashboard/users/');
      await expect(adminPage.getByText('ndsl@up.edu.ph')).toBeVisible();
      await expect(adminPage.getByRole('button', { name: 'Demote', exact: true })).toHaveCount(5);
      const status = await adminPage.evaluate(async userId => {
        const data = new FormData();
        data.set('userId', userId);
        const response = await fetch('/dashboard/users/?/demote-head', {
          method: 'POST',
          body: data,
        });
        return response.status;
      }, ndslHeadUserId);
      expect(status).toBe(200);
      await adminPage.reload();
      await expect(adminPage.getByText('ndsl@up.edu.ph')).not.toBeVisible();
      await expect(adminPage.getByRole('button', { name: 'Demote', exact: true })).toHaveCount(4);
    });
    await test.step('demoting a non-lab-head returns 404', async () => {
      const status = await adminPage.evaluate(async userId => {
        const data = new FormData();
        data.set('userId', userId);
        const response = await fetch('/dashboard/users/?/demote-head', {
          method: 'POST',
          body: data,
        });
        return response.status;
      }, adminUserId);
      expect(status).toBe(404);
    });
    await test.step('re-inviting a demoted lab head restores them', async () => {
      await adminPage.goto('/dashboard/users/');
      await expect(adminPage.getByText('ndsl@up.edu.ph')).not.toBeVisible();
      await expect(adminPage.getByRole('button', { name: 'Demote', exact: true })).toHaveCount(4);
      await adminPage.getByRole('button', { name: 'Manage Invitations' }).first().click();
      const sheet = adminPage.getByRole('dialog');
      await expect(sheet).toBeVisible();
      await sheet.locator('select#lab-select').selectOption('ndsl');
      await sheet.locator('input#faculty-email').fill('ndsl@up.edu.ph');
      const responsePromise = adminPage.waitForResponse('/dashboard/users/?/faculty');
      await sheet.getByRole('button', { name: 'Invite' }).click();
      const response = await responsePromise;
      const responseData = await response.json();
      expect(responseData.type).toBe('success');
      await adminPage.keyboard.press('Escape');
      await adminPage.reload();
      await expect(adminPage.getByText('ndsl@up.edu.ph')).toBeVisible();
      await expect(adminPage.getByRole('button', { name: 'Demote', exact: true })).toHaveCount(5);
    });
  },
);
test(
  'The lab catalog can archive and restore ACL',
  { tag: '@administration' },
  async ({ adminPage }) => {
    await test.step('navigates to labs page', async () => {
      await adminPage.goto('/dashboard/labs/');
      await expect(adminPage).toHaveURL('/dashboard/labs/');
      await expect(
        adminPage.getByText('Networks and Distributed Systems Laboratory'),
      ).toBeVisible();
      await expect(adminPage.getByText('Computer Security Laboratory')).toBeVisible();
      await expect(adminPage.getByText('Scientific Computing Laboratory')).toBeVisible();
      await expect(
        adminPage.getByText('Computer Vision and Machine Intelligence Laboratory'),
      ).toBeVisible();
      await expect(adminPage.getByText('Algorithms and Complexity Laboratory')).toBeVisible();
    });
    await test.step('archives ACL', async () => {
      await adminPage.goto('/dashboard/labs/');
      const aclRow = adminPage
        .locator('tbody tr')
        .filter({ hasText: 'Algorithms and Complexity Laboratory' });
      await expect(aclRow).toBeVisible();
      const archiveResponsePromise = adminPage.waitForResponse('/dashboard/labs/?/archive');
      await aclRow.getByRole('button').click();
      const archiveResponse = await archiveResponsePromise;
      const archiveResponseData = await archiveResponse.json();
      expect(archiveResponseData.type).toBe('success');
    });
    await test.step('shows ACL in archived labs', async () => {
      await adminPage.goto('/dashboard/labs/');
      await adminPage.getByRole('tab', { name: /Archived Labs/u }).click();
      const archivedAclRow = adminPage
        .locator('tbody tr')
        .filter({ hasText: 'Algorithms and Complexity Laboratory' });
      await expect(archivedAclRow).toBeVisible();
    });
    await test.step('restores ACL from archived labs', async () => {
      await adminPage.goto('/dashboard/labs/');
      await adminPage.getByRole('tab', { name: /Archived Labs/u }).click();
      const archivedAclRow = adminPage
        .locator('tbody tr')
        .filter({ hasText: 'Algorithms and Complexity Laboratory' });
      await expect(archivedAclRow).toBeVisible();
      const restoreResponsePromise = adminPage.waitForResponse('/dashboard/labs/?/restore');
      await archivedAclRow.getByRole('button').click();
      const restoreResponse = await restoreResponsePromise;
      const restoreResponseData = await restoreResponse.json();
      expect(restoreResponseData.type).toBe('success');
    });
  },
);
