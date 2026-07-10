import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  // Opt out of global authentication for this test suite
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should navigate to login page and show form', async ({ page }) => {
    await page.goto('/');
    
    // Find login link and click it
    await page.getByRole('link', { name: 'Sign In' }).click();
    
    // Verify we are on the login page
    await expect(page).toHaveURL(/.*\/login/);
    
    // Verify email and password inputs are visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
