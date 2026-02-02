// Tests are run sequentially within the same file by default.
// Exact ordering is critical for the end-to-end tests.

import { expect } from '@playwright/test';

import { testStudent } from './fixtures/users';

testStudent.describe('Student Registration', () => {
  testStudent(
    'should land on /dashboard/student/',
    async ({ page }) => await expect(page).toHaveURL('/dashboard/student/'),
  );
});
