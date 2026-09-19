import { errors, expect, type Page, type Request } from '@playwright/test';

export async function expectNoRequests(
  page: Page,
  pathname: string,
  exercise: () => Promise<void>,
) {
  const requests: string[] = [];
  function matches(request: Request) {
    return new URL(request.url()).pathname === pathname;
  }
  function record(request: Request) {
    if (matches(request)) requests.push(request.url());
  }
  page.on('request', record);
  try {
    await exercise();
    // Observe from before the action until one second after its UI outcome is ready.
    await expect(page.waitForRequest(matches, { timeout: 1000 })).rejects.toThrow(
      errors.TimeoutError,
    );
    expect(requests).toEqual([]);
  } finally {
    page.off('request', record);
  }
}
