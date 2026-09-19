import { expectLabAssignmentMembers } from '$tests/actions/faculty';
import { draftYearPattern, getDraftRow, getHistoryDraft } from '$tests/actions/history';
import { expectStudentDashboardText } from '$tests/actions/student';
import { test } from '$tests/fixtures/users';
import { expect } from '@playwright/test';

test.describe('Archived-Lab Draft Results', { tag: '@archived-labs-results' }, () => {
  test.describe.configure({ mode: 'parallel' });

  test('shows the expected zero-lottery finalized breakdown', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/drafts/2/');
    await expect(adminPage.locator('#stat-total-students')).toHaveText('3');
    await expect(adminPage.locator('#stat-participating-labs')).toHaveText('4');
    await adminPage.getByRole('button', { name: /^Lottery$/u }).click();
    await expect(
      adminPage.locator('[data-slot="empty"]').filter({ hasText: 'No lottery placements' }),
    ).toBeVisible();
    await adminPage.getByRole('button', { name: 'See Results' }).click();
    for (const [id, title, count] of [
      ['#section-regular-drafted', 'Regular Drafted', '3'],
      ['#section-intervention-drafted', 'Intervention Drafted', '0'],
      ['#section-lottery-drafted', 'Lottery Drafted', '0'],
    ] as const) {
      const trigger = adminPage.locator(`${id} [data-slot="accordion-trigger"]`);
      await expect(trigger).toContainText(title);
      await expect(trigger.locator('[data-slot="badge"]')).toHaveText(count);
    }
  });

  test('retains first-draft lottery results after the second draft finalizes', async ({
    adminPage,
  }) => {
    await adminPage.goto('/dashboard/drafts/1/');
    await adminPage.getByRole('button', { name: 'Lottery' }).click();
    const outcomeCard = adminPage
      .getByText('Per-Lab Lottery Outcome')
      .locator('xpath=ancestor::*[@data-slot="card"]');
    await outcomeCard.getByRole('button', { name: 'View Results' }).click();
    const sheet = adminPage.locator('[data-slot="sheet-content"]').last();
    await expect(sheet.getByRole('heading', { name: 'Lottery Results' })).toBeVisible();
    await expect(sheet.locator('tbody tr')).toHaveCount(3);
  });

  test('lists both finalized drafts and explains second-draft history', async ({
    adminPage,
    page,
  }) => {
    await adminPage.goto('/dashboard/drafts/');
    await expect(getDraftRow(adminPage, '1').locator('td').first()).toHaveText(/\d{4}/u);
    await expect(getDraftRow(adminPage, '2').locator('td').first()).toHaveText(/\d{4}/u);
    await expect(adminPage.getByText('Finalized')).toHaveCount(2);
    await page.goto('/history/');
    await expect(getHistoryDraft(page, '2')).toContainText(draftYearPattern);
    await expect(page.getByText(/over 2 rounds/u)).toBeVisible();
    await page.goto('/history/2/');
    await expect(page.getByText(/was held from/u)).toBeVisible();
    await expect(page.getByText(/over 2 rounds/u)).toBeVisible();
    const textContents = await page
      .locator('section > ol.border-s > li.ms-6 ol.space-y-1 > li')
      .allTextContents();
    const texts = textContents.map(text => text.replaceAll(/\s+/gu, ' ').trim());
    function indexOf(expression: RegExp) {
      return texts.findIndex(text => expression.test(text));
    }
    const round2 = indexOf(/2nd batch/iu);
    const round1 = indexOf(/1st batch/iu);
    expect(indexOf(/was finalized/u)).toBe(0);
    expect(indexOf(/was created/u)).toBe(texts.length - 1);
    expect(round2).toBeGreaterThanOrEqual(0);
    expect(round1).toBeGreaterThanOrEqual(0);
    expect(round2).toBeLessThan(round1);
    expect(indexOf(/obtained a batch.*lottery/isu)).toBe(-1);
  });

  test('retains archived CSL in read models and the students export', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/labs/');
    await adminPage.getByRole('tab', { name: /Archived Labs/u }).click();
    await expect(adminPage.getByText('Computer Security Laboratory')).toBeVisible();
    const response = await adminPage.request.get('/dashboard/drafts/2/students.csv/');
    expect(response.status()).toBe(200);
    const responseText = await response.text();
    const cslRow = responseText
      .split('\n')
      .find(line => line.includes('second-csl-first-choice.student@up.edu.ph'));
    expect(cslRow).toBeTruthy();
    expect(cslRow ?? '').toContain('csl');
  });

  test('shows SecondNdsl the NDSL assignment', async ({ secondRoundNdslFirstChoicePage }) =>
    await expectStudentDashboardText(
      secondRoundNdslFirstChoicePage,
      /Networks and Distributed Systems Laboratory/u,
    ));

  test('shows SecondCsl the CSL assignment', async ({ secondRoundCslFirstChoicePage }) =>
    await expectStudentDashboardText(
      secondRoundCslFirstChoicePage,
      /Computer Security Laboratory/u,
    ));

  test('shows SecondScl the SCL assignment', async ({ secondRoundSclSecondChoicePage }) =>
    await expectStudentDashboardText(
      secondRoundSclSecondChoicePage,
      /Scientific Computing Laboratory/u,
    ));

  test('shows NDSL its second-draft member', async ({ ndslHeadPage }) =>
    await expectLabAssignmentMembers(ndslHeadPage, '2', [/SecondNdsl/u]));

  test('shows CSL its second-draft member', async ({ cslHeadPage }) =>
    await expectLabAssignmentMembers(cslHeadPage, '2', [/SecondCsl/u]));

  test('shows SCL its second-draft member', async ({ sclHeadPage }) =>
    await expectLabAssignmentMembers(sclHeadPage, '2', [/SecondScl/u]));
});
