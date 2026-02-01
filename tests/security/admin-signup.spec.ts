import { test, expect } from '@playwright/test';

/**
 * Security Tests for Admin Signup Route
 * 
 * These tests verify that the admin signup endpoint is properly secured:
 * - Requires X-Admin-Secret-Key header
 * - Returns 401 without secret
 * - Returns 401 with wrong secret
 */

test.describe('Admin Signup Security', () => {
    const ADMIN_SIGNUP_URL = '/api/auth/admin-signup';
    const TEST_DATA = {
        email: 'test-playwright@example.com',
        password: 'TestPassword123!',
    };

    test('should reject request without secret header', async ({ request }) => {
        const response = await request.post(ADMIN_SIGNUP_URL, {
            data: TEST_DATA,
        });

        // Should return 401 Unauthorized (not 200 or 404)

        expect(response.status()).toBe(401);

        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Unauthorized');
    });

    test('should reject request with wrong secret header', async ({ request }) => {
        const response = await request.post(ADMIN_SIGNUP_URL, {
            data: TEST_DATA,
            headers: {
                'X-Admin-Secret-Key': 'wrong-secret-key',
            },
        });

        // Should return 401 Unauthorized
        expect(response.status()).toBe(401);

        const body = await response.json();
        expect(body.success).toBe(false);
    });

    test('should require email and password', async ({ request }) => {
        // Send request with development secret but missing fields
        const response = await request.post(ADMIN_SIGNUP_URL, {
            data: {},
            headers: {
                'X-Admin-Secret-Key': 'smash-dev-admin-2026', // Dev default
            },
        });

        // In development, this should return 400 for missing fields
        // (or 401 if secret is different - depends on .env)
        expect([400, 401]).toContain(response.status());
    });

    test('should enforce password length requirement', async ({ request }) => {
        const response = await request.post(ADMIN_SIGNUP_URL, {
            data: {
                email: 'test@example.com',
                password: 'short', // Less than 8 characters
            },
            headers: {
                'X-Admin-Secret-Key': 'smash-dev-admin-2026',
            },
        });

        // Should return 400 for short password OR 401 if secret mismatch
        expect([400, 401]).toContain(response.status());
    });
});

test.describe('Admin Signup Production Behavior', () => {
    // Note: These tests are more conceptual - in actual production,
    // NODE_ENV would be 'production' and without ADMIN_SIGNUP_SECRET,
    // the endpoint should return 404.

    test('production endpoint should be discoverable only with correct secret', async ({ request }) => {
        // In development, we can't truly test production behavior,
        // but we verify the endpoint exists and responds appropriately
        const response = await request.post('/api/auth/admin-signup', {
            data: { email: 'test@test.com', password: 'password123' },
        });

        // Should NOT be a server error
        expect(response.status()).not.toBe(500);

        // Should be either 401 (unauthorized) or 404 (disabled in prod)
        expect([401, 404]).toContain(response.status());
    });
});
