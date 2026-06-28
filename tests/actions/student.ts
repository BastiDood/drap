import { expect, type Locator, type Page } from '@playwright/test';

interface LabPreferenceInput {
  labs: readonly (string | RegExp)[];
  remarks?: string;
}

interface SharedPhotoLabPreferenceInput extends LabPreferenceInput {
  photoConsent: 'google' | 'none';
}

interface CustomPhotoLabPreferenceInput extends LabPreferenceInput {
  customImage: Parameters<Locator['setInputFiles']>[0];
  photoConsent: 'custom';
}

export async function completeStudentProfile(page: Page, studentNumber: string) {
  await page.goto('/dashboard/student/');
  await page.getByLabel('Student Number').fill(studentNumber);

  const responsePromise = page.waitForResponse('/dashboard/?/profile');
  await page.getByRole('button', { name: 'Complete Profile' }).click();
  const response = await responsePromise;
  const responseData = await response.json();
  expect(responseData.type).toBe('success');
}

export async function submitLabPreferences(
  page: Page,
  input: SharedPhotoLabPreferenceInput | CustomPhotoLabPreferenceInput,
) {
  await page.goto('/dashboard/student/');
  await expect(page.getByText('Select Lab Preference')).toBeVisible();

  for (const lab of input.labs) await page.getByRole('button', { name: lab }).click();

  if (typeof input.remarks !== 'undefined')
    await page.locator('textarea[name="remarks"]').first().fill(input.remarks);

  await page.getByLabel('Photo Consent').selectOption(input.photoConsent);
  if (input.photoConsent === 'custom')
    await page.getByLabel('Custom Image').setInputFiles(input.customImage);

  page.once('dialog', async dialog => await dialog.accept());
  const responsePromise = page.waitForResponse('/dashboard/student/?/submit');
  await page.getByRole('button', { name: 'Submit Lab Preferences' }).click();
  const response = await responsePromise;
  const responseData = await response.json();
  expect(responseData.type).toBe('success');
}

export async function expectStudentDashboardText(page: Page, expected: string | RegExp) {
  await page.goto('/dashboard/student/');
  await expect(page.getByText(expected)).toBeVisible();
}
