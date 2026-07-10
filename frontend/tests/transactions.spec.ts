import { test, expect } from '@playwright/test';

test.describe('Transactions Protected Page', () => {
  test('should load transactions and show table', async ({ page }) => {
    await page.goto('/transactions');
    await expect(page).toHaveURL(/.*\/transactions/);
    
    // Verify Transactions text exists
    await expect(page.getByText('Transactions').first()).toBeVisible();
    
    // Verify that the table or table skeleton loads
    await expect(page.locator('table, .animate-pulse').first()).toBeVisible();
  });
});
