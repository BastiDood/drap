import { expect, type Page } from '@playwright/test';

export async function assertLogout(page: Page) {
  await page.goto('/dashboard/');
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(cookie => cookie.name === 'sid');
  expect(sessionCookie, 'the authenticated browser has a session').toBeDefined();
  if (typeof sessionCookie === 'undefined') throw new Error('Missing authenticated session');
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('heading', { name: 'Draft Ranking Automated Processor' }),
  ).toBeVisible();
  const cookiesAfterLogout = await page.context().cookies();
  expect(cookiesAfterLogout.some(cookie => cookie.name === 'sid')).toBe(false);
  const response = await page.request.get('/dashboard/', {
    headers: { Cookie: `sid=${sessionCookie.value}` },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe('/dashboard/oauth/login');
}
