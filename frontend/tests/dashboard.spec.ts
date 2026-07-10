import { test, expect } from '@playwright/test';

test.describe('Dashboard Protected Page', () => {
  test('should load dashboard and display summary cards', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Verify Dashboard text exists (handles cases where PageHeader doesn't use standard heading tags)
    await expect(page.getByText('Dashboard').first()).toBeVisible();
    
    // Verify the presence of summary cards (either skeletons or real cards)
    await expect(page.locator('.card, .bg-bg-surface').first()).toBeVisible();
  });
});
