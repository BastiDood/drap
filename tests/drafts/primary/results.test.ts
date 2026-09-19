import { expectChartTooltipPoint } from '$tests/actions/charts';
import { expectLabAssignmentMembers } from '$tests/actions/faculty';
import { expectStudentDashboardText } from '$tests/actions/student';
import { test } from '$tests/fixtures/users';
import { expect } from '@playwright/test';

test.describe('Primary Draft Finalized Results', { tag: '@full-lifecycle-results' }, () => {
  test.describe.configure({ mode: 'parallel' });

  test('shows finalized statistics and all chart series', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/drafts/1/');
    await expect(adminPage.locator('#stat-total-students')).toHaveText('8');
    await expect(adminPage.locator('#stat-participating-labs')).toHaveText('5');

    const rounds = adminPage.locator('#draft-rounds-chart');
    await expect(rounds).toBeVisible();
    for (const label of ['R1', 'R2', 'R3', 'Interventions', 'Lottery'])
      await expect(rounds).toContainText(label);

    const supplyDemand = adminPage.locator('#supply-demand-chart');
    await expect(supplyDemand).toBeVisible();
    for (const label of ['NDSL', 'CSL', 'SCL', 'CVMIL', 'ACL', 'Supply', 'Demand', 'Actual'])
      await expect(supplyDemand).toContainText(label);
    await expect(supplyDemand.locator('.lc-legend-swatch-button')).toHaveCount(3);
    await expect(supplyDemand).toContainText('0%');

    const distribution = adminPage.locator('#lab-distribution-chart');
    await expect(distribution).toBeVisible();
    for (const label of ['NDSL', 'CSL', 'SCL', 'CVMIL', 'ACL'])
      await expect(distribution).toContainText(label);
    await expect(distribution.locator('.lc-legend-swatch-button')).toHaveCount(5);
    await expect(distribution.getByText('Unassigned')).toHaveCount(0);

    const alignment = adminPage.locator('#preference-alignment-chart');
    await expect(alignment).toBeVisible();
    for (const label of ['1st Choice', '2nd Choice', '3rd Choice', 'Not Preferred'])
      await expect(alignment).toContainText(label);
    await expect(alignment).toContainText('Borda Score');
    await expect(alignment.locator('.text-3xl')).toHaveText(/^\d+(?:\.\d+)?%$/u);
    const scoreTextContent = await alignment.locator('.text-3xl').textContent();
    const scoreText = scoreTextContent?.trim() ?? '';
    const score = Number.parseFloat(scoreText.replace('%', ''));
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('switches plotted metrics between assignments, remaining students, and lab quotas', async ({
    adminPage,
  }) => {
    await adminPage.goto('/dashboard/drafts/1/');
    const title = adminPage.locator('#draft-rounds-chart-title');
    const modeSelect = adminPage.locator('#draft-rounds-chart-mode');
    await expect(title).toHaveText('Students Assigned per Phase');
    await expectChartTooltipPoint(adminPage, 0, {
      label: 'Round 1',
      metric: 'Assigned',
      value: 2,
      hiddenMetrics: ['Not Yet Assigned', 'Remaining Quota'],
    });
    await expectChartTooltipPoint(adminPage, 1, {
      label: 'Round 2',
      metric: 'Assigned',
      value: 1,
      hiddenMetrics: ['Not Yet Assigned', 'Remaining Quota'],
    });
    await expectChartTooltipPoint(adminPage, 2, {
      label: 'Round 3',
      metric: 'Assigned',
      value: 1,
      hiddenMetrics: ['Not Yet Assigned', 'Remaining Quota'],
    });
    await expectChartTooltipPoint(adminPage, 3, {
      label: 'Interventions',
      metric: 'Assigned',
      value: 1,
      hiddenMetrics: ['Not Yet Assigned', 'Remaining Quota'],
    });
    await expectChartTooltipPoint(adminPage, 4, {
      label: 'Lottery',
      metric: 'Assigned',
      value: 3,
      hiddenMetrics: ['Not Yet Assigned', 'Remaining Quota'],
    });
    await modeSelect.selectOption('remaining');
    await expect(title).toHaveText('Students Not Yet Assigned per Phase');
    await expectChartTooltipPoint(adminPage, 0, {
      label: 'Round 1',
      metric: 'Not Yet Assigned',
      value: 6,
      hiddenMetrics: ['Assigned', 'Remaining Quota'],
    });
    await expectChartTooltipPoint(adminPage, 1, {
      label: 'Round 2',
      metric: 'Not Yet Assigned',
      value: 5,
      hiddenMetrics: ['Assigned', 'Remaining Quota'],
    });
    await expectChartTooltipPoint(adminPage, 2, {
      label: 'Round 3',
      metric: 'Not Yet Assigned',
      value: 4,
      hiddenMetrics: ['Assigned', 'Remaining Quota'],
    });
    await expectChartTooltipPoint(adminPage, 3, {
      label: 'Interventions',
      metric: 'Not Yet Assigned',
      value: 3,
      hiddenMetrics: ['Assigned', 'Remaining Quota'],
    });
    await expectChartTooltipPoint(adminPage, 4, {
      label: 'Lottery',
      metric: 'Not Yet Assigned',
      value: 0,
      hiddenMetrics: ['Assigned', 'Remaining Quota'],
    });

    await modeSelect.selectOption('assigned');
    const labSelect = adminPage.locator('#draft-rounds-chart-lab');
    await labSelect.selectOption('ndsl');
    const rounds = adminPage.locator('#draft-rounds-chart');
    for (const label of ['R1', 'R2', 'R3', 'Interventions', 'Lottery'])
      await expect(rounds).toContainText(label);
    await modeSelect.selectOption('remaining');
    await expect(title).toHaveText('Labs Remaining Quota per Phase');
    await expectChartTooltipPoint(adminPage, 1, {
      label: 'Round 2',
      metric: 'Remaining Quota',
      value: 1,
      hiddenMetrics: ['Assigned', 'Not Yet Assigned'],
    });
  });

  test('groups final assignments by regular, intervention, and lottery result', async ({
    adminPage,
  }) => {
    await adminPage.goto('/dashboard/drafts/1/');
    await adminPage.getByRole('button', { name: 'See Results' }).click();
    await expect(adminPage.locator('#section-regular-drafted')).toBeVisible();
    const ids = await adminPage
      .locator('#section-regular-drafted, #section-intervention-drafted, #section-lottery-drafted')
      .evaluateAll(nodes => nodes.map(node => node.id));
    expect(ids).toEqual([
      'section-regular-drafted',
      'section-intervention-drafted',
      'section-lottery-drafted',
    ]);
    for (const [id, title, count] of [
      ['#section-regular-drafted', 'Regular Drafted', '4'],
      ['#section-intervention-drafted', 'Intervention Drafted', '1'],
      ['#section-lottery-drafted', 'Lottery Drafted', '3'],
    ] as const) {
      const trigger = adminPage.locator(`${id} [data-slot="accordion-trigger"]`);
      await expect(trigger).toContainText(title);
      await expect(trigger.locator('[data-slot="badge"]')).toHaveText(count);
    }
    const interventionDate = adminPage.locator('[id^="intervention-date-"]').first();
    await expect(interventionDate).toBeVisible();
    const interventionDateText = await interventionDate.textContent();
    expect((interventionDateText ?? '').trim().length).toBeGreaterThan(0);
  });

  test('shows Eager the first-round NDSL assignment', async ({ eagerDrafteePage }) =>
    await expectStudentDashboardText(
      eagerDrafteePage,
      /Networks and Distributed Systems Laboratory/u,
    ));

  test('shows Patient the first-round CSL assignment', async ({ patientCandidatePage }) =>
    await expectStudentDashboardText(patientCandidatePage, /Computer Security Laboratory/u));

  test('shows Unlucky the third-round NDSL assignment', async ({ unluckyFullRankerPage }) =>
    await expectStudentDashboardText(
      unluckyFullRankerPage,
      /Networks and Distributed Systems Laboratory/u,
    ));

  test('shows PartialToDrafted the second-round CSL assignment', async ({ partialToDraftedPage }) =>
    await expectStudentDashboardText(partialToDraftedPage, /Computer Security Laboratory/u));

  test('shows Persistent the lottery assignment', async ({ persistentHopefulPage }) =>
    await expectStudentDashboardText(persistentHopefulPage, /Laboratory/u));

  test('shows PartialToLottery the lottery assignment', async ({ partialToLotteryPage }) =>
    await expectStudentDashboardText(partialToLotteryPage, /Laboratory/u));

  test('shows NoRank the lottery assignment', async ({ noRankStudentPage }) =>
    await expectStudentDashboardText(noRankStudentPage, /Laboratory/u));

  test('shows Idle the lottery assignment', async ({ idleBystanderPage }) =>
    await expectStudentDashboardText(idleBystanderPage, /Laboratory/u));

  test('shows Late that no active draft assignment exists', async ({ lateRegistrantPage }) =>
    await expectStudentDashboardText(lateRegistrantPage, 'No Active Draft'));

  test('shows NDSL finalized members', async ({ ndslHeadPage }) =>
    await expectLabAssignmentMembers(ndslHeadPage, '1', [/Eager/u, /Unlucky/u]));

  test('shows CSL finalized members', async ({ cslHeadPage }) =>
    await expectLabAssignmentMembers(cslHeadPage, '1', [/Patient/u, /Partial/u]));
});
