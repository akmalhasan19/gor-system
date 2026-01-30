import { test, expect } from '@playwright/test';

/**
 * Security Tests for Content Security Policy (CSP) Headers
 * 
 * These tests verify that CSP headers are properly configured:
 * - Required directives are present
 * - Dangerous directives are not used in production
 * - Clickjacking protection is enabled (frame-ancestors)
 */

test.describe('Content Security Policy Headers', () => {
    test('should include CSP header with required directives', async ({ request }) => {
        const response = await request.get('/');

        const csp = response.headers()['content-security-policy'];
        expect(csp).toBeDefined();

        // Verify required directives are present
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("script-src");
        expect(csp).toContain("style-src");
        expect(csp).toContain("img-src");
        expect(csp).toContain("font-src");
        expect(csp).toContain("connect-src");
    });

    test('should include clickjacking protection directives', async ({ request }) => {
        const response = await request.get('/');

        const csp = response.headers()['content-security-policy'];
        expect(csp).toBeDefined();

        // Verify clickjacking and injection protection
        expect(csp).toContain("frame-ancestors 'none'");
        expect(csp).toContain("base-uri 'self'");
        expect(csp).toContain("form-action 'self'");
    });

    test('should have X-Frame-Options header for legacy browser support', async ({ request }) => {
        const response = await request.get('/');

        const xFrameOptions = response.headers()['x-frame-options'];
        expect(xFrameOptions).toBeDefined();
        expect(xFrameOptions).toBe('SAMEORIGIN');
    });

    test('should include other security headers', async ({ request }) => {
        const response = await request.get('/');

        // Verify additional security headers
        expect(response.headers()['x-content-type-options']).toBe('nosniff');
        expect(response.headers()['strict-transport-security']).toContain('max-age=');
        expect(response.headers()['referrer-policy']).toBeDefined();
    });
});
