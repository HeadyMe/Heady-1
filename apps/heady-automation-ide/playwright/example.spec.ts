import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Heady Automation IDE/);
});

test('shows connected status', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Connected')).toBeVisible();
});
