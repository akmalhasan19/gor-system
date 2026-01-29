import { test, expect } from '@playwright/test';

test('login page loads and displays elements', async ({ page }) => {
    await page.goto('/login');

    // Verify page title/header
    await expect(page).toHaveTitle(/GOR Management System|Smash Partner/);
    await expect(page.getByText('Smash.Partner')).toBeVisible();

    // Verify inputs exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Verify submit button
    await expect(page.getByRole('button', { name: 'MASUK SYSTEM' })).toBeVisible();

    // Verify "Forgot Password" or "Register" link presence
    await expect(page.getByText('Belum punya akun? Daftar disini')).toBeVisible();
});
