import { expect, type Page } from '@playwright/test';

interface CreateDraftInput {
  closesAt: Date;
  rounds: number;
}

interface Quotas {
  acl?: number;
  csl?: number;
  cvmil?: number;
  ndsl?: number;
  scl?: number;
}

export async function openRegularRounds(page: Page) {
  const regularRoundsTrigger = page.getByRole('button', { name: /Regular Rounds/u });
  const isAriaExpanded = await regularRoundsTrigger.getAttribute('aria-expanded');
  if (isAriaExpanded !== 'true') await regularRoundsTrigger.click();

  await expect(page.locator('#regular-round-summary-chart')).toBeVisible();
}

export async function openInterventions(page: Page) {
  const interventionsTrigger = page.getByRole('button', { name: /^Interventions$/u });
  const isAriaExpanded = await interventionsTrigger.getAttribute('aria-expanded');
  if (isAriaExpanded !== 'true') await interventionsTrigger.click();

  await expect(page.locator('#quota-dumbbell-chart')).toBeVisible();
}

export async function createDraft(page: Page, input: CreateDraftInput) {
  await page.goto('/dashboard/drafts/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Create Draft' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.locator('input#closesAt').fill(input.closesAt.toISOString().slice(0, 16));
  await dialog.locator('input#rounds').fill(String(input.rounds));

  page.once('dialog', async dialog => await dialog.accept());
  const responsePromise = page.waitForResponse('/dashboard/drafts/?/init');
  await dialog.getByRole('button', { name: 'Create Draft' }).click();
  const response = await responsePromise;
  const responseData = await response.json();
  expect(responseData.type).toBe('success');
}

export async function updateInitialQuota(page: Page, draftId: string, quotas: Quotas) {
  await page.goto(`/dashboard/drafts/${draftId}/`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Setup Quota' }).click();
  const editor = page.locator('#draft-quota-editor-initial');
  await expect(editor).toBeVisible();

  for (const [labId, quota] of Object.entries(quotas))
    await editor.locator(`input[name="${labId}"]`).fill(String(quota));

  const responsePromise = page.waitForResponse(`/dashboard/drafts/${draftId}/?/quota`);
  await editor.getByRole('button', { name: 'Update Initial Snapshots' }).click();
  const response = await responsePromise;
  const responseData = await response.json();
  expect(responseData.type).toBe('success');
}

export async function updateLotteryQuota(page: Page, draftId: string, quotas: Quotas) {
  await page.goto(`/dashboard/drafts/${draftId}/`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('main')).toBeVisible();
  await openInterventions(page);

  const editLotteryQuotaButton = page.getByRole('button', { name: 'Edit Lottery Quota' });
  await editLotteryQuotaButton.click();
  const editor = page.locator('#draft-quota-editor-lottery');
  await expect(editor).toBeVisible();

  for (const [labId, quota] of Object.entries(quotas))
    await editor.locator(`input[name="${labId}"]`).fill(String(quota));

  const responsePromise = page.waitForResponse(`/dashboard/drafts/${draftId}/?/quota`);
  await editor.getByRole('button', { name: 'Update Lottery Snapshots' }).click();
  const response = await responsePromise;
  const responseData = await response.json();
  expect(responseData.type).toBe('success');
}

export async function startDraft(page: Page, draftId: string) {
  await page.goto(`/dashboard/drafts/${draftId}/`);
  await page.waitForLoadState('networkidle');
  page.once('dialog', async dialog => await dialog.accept());

  const responsePromise = page.waitForResponse(`/dashboard/drafts/${draftId}/?/start`);
  await page.getByRole('button', { name: 'Start Draft' }).click();
  const response = await responsePromise;
  const responseData = await response.json();
  expect(responseData.type).toBe('success');
}

export async function runLottery(page: Page, draftId: string) {
  await page.goto(`/dashboard/drafts/${draftId}/`);
  await page.waitForLoadState('networkidle');
  await openInterventions(page);
  page.once('dialog', async dialog => await dialog.accept());

  const runLotteryButton = page.getByRole('button', { name: 'Run Lottery' });
  await expect(runLotteryButton).toBeVisible();
  const responsePromise = page.waitForResponse(`/dashboard/drafts/${draftId}/?/conclude`);
  await runLotteryButton.click();
  const response = await responsePromise;
  const responseData = await response.json();
  expect(responseData.type).toBe('success');
}

export async function finalizeDraft(page: Page, draftId: string) {
  await page.goto(`/dashboard/drafts/${draftId}/`);
  await page.waitForLoadState('networkidle');
  page.once('dialog', async dialog => await dialog.accept());

  await expect(page.getByRole('button', { name: 'Finalize Draft' })).toBeVisible();
  const responsePromise = page.waitForResponse(`/dashboard/drafts/${draftId}/?/finalize`);
  await page.getByRole('button', { name: 'Finalize Draft' }).click();
  const response = await responsePromise;
  const responseData = await response.json();
  expect(responseData.type).toBe('success');
}
