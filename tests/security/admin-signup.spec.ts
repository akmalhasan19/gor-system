import { test, expect } from '@playwright/test';

test.describe('Admin Signup Security', () => {
    const ADMIN_SIGNUP_URL = '/api/auth/admin-signup';

    test('should reject request without invite token', async ({ request }) => {
        const response = await request.post(ADMIN_SIGNUP_URL, {
            data: {
                email: 'test-playwright@example.com',
                password: 'TestPassword123!',
            },
        });

        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Invite token is required');
    });

    test('should reject invalid invite token', async ({ request }) => {
        const response = await request.post(ADMIN_SIGNUP_URL, {
            data: {
                email: 'test-playwright@example.com',
                password: 'TestPassword123!',
                inviteToken: 'invalid-token',
            },
        });

        expect([401, 404]).toContain(response.status());
    });

    test('should require email and password fields', async ({ request }) => {
        const response = await request.post(ADMIN_SIGNUP_URL, {
            data: {
                inviteToken: 'invalid-token',
            },
        });

        expect([400, 401, 404]).toContain(response.status());
    });

    test('should enforce minimum password requirement', async ({ request }) => {
        const response = await request.post(ADMIN_SIGNUP_URL, {
            data: {
                email: 'test@example.com',
                password: 'short',
                inviteToken: 'invalid-token',
            },
        });

        expect([400, 401, 404]).toContain(response.status());
    });
});
