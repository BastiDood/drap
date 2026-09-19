import {
  draftYearPattern,
  getDraftRow,
  getHistoryDraft,
  getHistoryTimelineTexts,
} from '$tests/actions/history';
import { test } from '$tests/fixtures/users';
import { expect } from '@playwright/test';

function indexOf(texts: readonly string[], expression: RegExp) {
  return texts.findIndex(text => expression.test(text));
}

test.describe('Primary Draft History', { tag: '@full-lifecycle-results' }, () => {
  test.describe.configure({ mode: 'parallel' });

  test('shows finalized draft status in the history index and detail page', async ({ page }) => {
    await page.goto('/history/');
    await expect(getHistoryDraft(page, '1')).toContainText(draftYearPattern);
    await expect(page.getByText(/was held from/u)).toBeVisible();
    await expect(page.getByText(/over 3 rounds/u)).toBeVisible();
    await page.goto('/history/1/');
    await expect(page.getByText(/was held from/u)).toBeVisible();
    await expect(page.getByText(/over 3 rounds/u)).toBeVisible();
  });

  test('keeps finalized history boundaries and internal events ordered', async ({ page }) => {
    const texts = await getHistoryTimelineTexts(page, 1);
    const finalized = indexOf(texts, /was finalized/u);
    const created = indexOf(texts, /was created/u);
    const internal = indexOf(
      texts,
      /selected their|obtained a batch of draftees|system has skipped/isu,
    );
    expect(finalized).toBe(0);
    expect(created).toBe(texts.length - 1);
    expect(internal).toBeGreaterThan(finalized);
    expect(internal).toBeLessThan(created);
  });

  test('orders lottery, regular rounds, and assignment mechanisms in the timeline', async ({
    page,
  }) => {
    const texts = await getHistoryTimelineTexts(page, 1);
    const lottery = indexOf(texts, /obtained a batch.*lottery/isu);
    const round3 = indexOf(texts, /3rd batch/iu);
    const round2 = indexOf(texts, /2nd batch/iu);
    const round1 = indexOf(texts, /1st batch/iu);
    expect(lottery).toBeGreaterThan(0);
    expect(lottery).toBeLessThan(round3);
    expect(round3).toBeLessThan(round2);
    expect(round2).toBeLessThan(round1);

    const intervention = indexOf(texts, /manual lottery intervention/iu);
    const randomization = indexOf(texts, /lottery randomization/iu);
    expect(intervention).toBeGreaterThanOrEqual(0);
    expect(randomization).toBeGreaterThanOrEqual(0);
    expect(texts[intervention]).not.toEqual(texts[randomization]);

    const interventions = texts.filter(text => /manual lottery intervention/iu.test(text));
    const lotteries = texts.filter(text => /lottery randomization/iu.test(text));
    expect(interventions).toHaveLength(1);
    expect(lotteries).toHaveLength(3);
    expect(
      texts.some(text =>
        /NDSL.*(?:manual lottery intervention|lottery randomization)/iu.test(text),
      ),
    ).toBe(false);
  });

  test('records every expected automatic skip and no extra NDSL first-round skip', async ({
    page,
  }) => {
    const timelineTexts = await getHistoryTimelineTexts(page, 1);
    const skipEntries = timelineTexts.filter(text => /system has skipped/iu.test(text));
    expect(skipEntries).toHaveLength(7);
    for (const expected of [
      /CVMIL for the 1st round/iu,
      /NDSL for the 2nd round/iu,
      /SCL for the 2nd round/iu,
      /ACL for the 2nd round/iu,
      /CSL for the 3rd round/iu,
      /SCL for the 3rd round/iu,
      /CVMIL for the 3rd round/iu,
    ])
      expect(skipEntries.some(text => expected.test(text))).toBe(true);
    expect(skipEntries.some(text => /NDSL for the 1st round/iu.test(text))).toBe(false);
  });

  test('lists the finalized draft in the administrator table', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/drafts/');
    await expect(getDraftRow(adminPage, '1').locator('td').first()).toHaveText(/\d{4}/u);
    await expect(adminPage.getByText('Finalized')).toBeVisible();
  });
});
