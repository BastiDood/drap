import { expect, type Page } from '@playwright/test';

export async function expectChartTooltipPoint(
  page: Page,
  pointIndex: number,
  expected: {
    label: string;
    metric: string;
    value: number;
    hiddenMetrics?: string[];
  },
) {
  const chart = page.locator('#draft-rounds-chart');
  const tooltip = page.locator('.draft-rounds-chart-tooltip');

  await chart.locator('.draft-rounds-chart-point').nth(pointIndex).hover({ force: true });

  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText(
    new RegExp(
      `${escapeRegex(expected.label)}\\s+${escapeRegex(expected.metric)}\\s+${escapeRegex(expected.value.toString())}`,
      'u',
    ),
  );

  for (const metric of expected.hiddenMetrics ?? [])
    await expect(tooltip.getByText(metric, { exact: true })).toHaveCount(0);
}

function escapeRegex(value: string) {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}
