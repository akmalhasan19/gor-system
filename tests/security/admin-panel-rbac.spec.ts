import { test, expect } from '@playwright/test';

test.describe('Internal Admin Panel RBAC', () => {
    test('unauthenticated user should be redirected from /internal/admin', async ({ page }) => {
        await page.goto('/internal/admin');
        await expect(page).toHaveURL(/\/login/);
    });

    test('unauthenticated request to /api/internal/admin/me should be denied', async ({ request }) => {
        const response = await request.get('/api/internal/admin/me');
        expect([401, 403]).toContain(response.status());
    });
});
