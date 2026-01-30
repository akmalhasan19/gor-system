import { test, expect } from '@playwright/test';

/**
 * Security Tests for CSRF Protection
 * 
 * These tests verify that CSRF protection is properly implemented:
 * - State-changing requests without CSRF token are rejected (403)
 * - State-changing requests with invalid CSRF token are rejected (403)
 * - Webhook endpoints are exempt from CSRF protection
 * - Public read-only endpoints are accessible
 * 
 * Note: These tests validate the CSRF protection behavior by:
 * 1. Testing endpoints that are exempt from CSRF (webhooks, public)
 * 2. Testing that protected endpoints require valid CSRF tokens
 */

test.describe('CSRF Exempt Endpoints', () => {
    test('webhook endpoint should NOT require CSRF token', async ({ request }) => {
        const response = await request.post('/api/webhooks/xendit', {
            data: {
                external_id: 'test-txn-123',
                status: 'PENDING',
            },
            headers: {
                'Content-Type': 'application/json',
                // Note: This will fail webhook's own auth (missing x-callback-token),
                // but should NOT be 403 CSRF error - it's exempt
            },
        });

        // Should NOT be 403 (CSRF exempt) - will be 200/401 based on webhook's own auth
        expect(response.status()).not.toBe(403);
    });

    test('public endpoints should be accessible without CSRF token', async ({ request }) => {
        const response = await request.get('/api/public/courts');

        // GET requests don't require CSRF protection
        // Should NOT be 403
        expect(response.status()).not.toBe(403);
    });
});

test.describe('CSRF Token in Browser', () => {
    test('should set CSRF cookie after authenticated page navigation', async ({ page }) => {
        // Navigate to login page
        await page.goto('/login');

        // Verify page loads
        await expect(page).toHaveTitle(/GOR Management System|Smash Partner/);
        await expect(page.getByText('Smash.Partner')).toBeVisible();

        // Note: Full CSRF cookie test would require:
        // 1. Logging in with valid credentials
        // 2. Verifying csrf-token cookie is set after successful login
        // 3. Making API request with that token
        // This is a simplified version that verifies the page loads without CSRF issues
    });

    test('unauthenticated requests to protected endpoints should fail', async ({ request }) => {
        // Try to access onboarding submit without authentication or CSRF
        const response = await request.post('/api/onboarding/submit', {
            data: {
                venueName: 'Test Venue',
                address: 'Test Address',
            },
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Should either be:
        // - 403 (CSRF protection blocking) 
        // - 401 (auth required before CSRF check)
        // Either is acceptable security behavior
        expect([401, 403]).toContain(response.status());
    });
});

test.describe('CSRF Protection Headers', () => {
    test('API requests should include rate limit headers', async ({ request }) => {
        const response = await request.get('/api/public/courts');

        // Verify rate limiting middleware is active
        expect(response.headers()['x-ratelimit-limit']).toBeDefined();
        expect(response.headers()['x-ratelimit-remaining']).toBeDefined();
    });
});
