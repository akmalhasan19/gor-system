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

    // Verify "Forgot Password" link presence (registration link removed)
    await expect(page.getByText('Lupa Password?')).toBeVisible();

    // Verify registration link is NOT visible (moved to invite-only /register)
    await expect(page.getByText('Belum punya akun? Daftar disini')).not.toBeVisible();
});

test('register page without token shows error', async ({ page }) => {
    await page.goto('/register');

    // Should show error message
    await expect(page.getByText('Undangan Tidak Valid')).toBeVisible();
    await expect(page.getByText('Link undangan tidak valid')).toBeVisible();

    // Should have button to go back to login
    await expect(page.getByRole('button', { name: 'Kembali ke Login' })).toBeVisible();
});

test('register page with invalid token shows error', async ({ page }) => {
    await page.goto('/register?token=invalid-token-12345');

    // Should show error message (after validation)
    await expect(page.getByText('Undangan Tidak Valid')).toBeVisible({ timeout: 10000 });
});
