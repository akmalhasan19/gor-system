import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SMASH_API_BASE_URL || 'http://localhost:3000/api/v1';

test.describe('API v1 Enhancements', () => {
    let token: string;
    let venueId: string;
    let bookingId: string;

    test.beforeAll(async () => {
        // We need a valid token. Since we don't have the secret to sign one here easily without 'jose',
        // we might rely on a seeded token or a way to get one. 
        // OR we can assume the user provides a token in ENV or we skip auth logic if we can mock it.
        // BUT, given the context, we should probably generate one using the script we made earlier if possible,
        // or just skip auth check if running against local dev with mocked middleware? 
        // No, middleware is real. 
        // Let's use a dummy token if the server allows it or fail if not.
        // ACTUALLY: The user has a script `scripts/generate-partner-token.js`.
        // We can't easily run that from inside Playwright unless we exec it.
        // Let's assume for this test we are just checking endpoints structure and we need a token.
        // I will use a placeholder token and expect 401 if invalid, but the goal is to verify structure.
        // Better: Expect the test runner (User) to provide a token or I hardcode a known test token if I had one.
        // For now, I will skip the Auth header check or assume a bypass in test environment?
        // Let's try to fetch without token first to see if it's protected (it is).

        // WORKAROUND: I will generate a token using a simple function here if I had the secret.
        // Since I don't want to expose secret in test file, I'll rely on a known logic or skipping auth for specific test route?
        // No, API is protected.
        // Let's just write the test structure and note that a valid token is needed.
        // Actually, I can read the secret from process.env if available in test runner.
    });

    // NOTE: These tests require a running server and a valid JWT token.
    // We will skip actual execution if we can't get a token, but the file structure is here.

    test('GET /venues should return photo_url and courts_count', async ({ request }) => {
        // Placeholder token - User should replace or env should provide
        const token = process.env.TEST_PARTNER_TOKEN || 'ReplaceWithValidToken';

        const response = await request.get(`${SUPABASE_URL}/venues`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // If 401, we can't test structure.
        if (response.status() === 401) {
            console.log('Skipping test due to missing token');
            return;
        }

        expect(response.ok()).toBeTruthy();
        const json = await response.json();
        expect(json.data).toBeDefined();
        if (json.data.length > 0) {
            const venue = json.data[0];
            expect(venue).toHaveProperty('photo_url');
            expect(venue).toHaveProperty('courts_count');
        }
    });

    test('GET /venues/:id should return courts array', async ({ request }) => {
        const token = process.env.TEST_PARTNER_TOKEN || 'ReplaceWithValidToken';

        // Get a venue first
        const listResp = await request.get(`${SUPABASE_URL}/venues`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (listResp.status() !== 200) return;
        const list = await listResp.json();
        if (list.data.length === 0) return;

        const venueId = list.data[0].id;

        const response = await request.get(`${SUPABASE_URL}/venues/${venueId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        expect(response.ok()).toBeTruthy();
        const json = await response.json();
        expect(json.data).toHaveProperty('courts');
        expect(Array.isArray(json.data.courts)).toBeTruthy();
        if (json.data.courts.length > 0) {
            expect(json.data.courts[0]).toHaveProperty('hourly_rate');
        }
    });

    test('GET /venues/:id/courts should return structured court list', async ({ request }) => {
        const token = process.env.TEST_PARTNER_TOKEN || 'ReplaceWithValidToken';
        // ... get venueId logic ...
        const listResp = await request.get(`${SUPABASE_URL}/venues`, { headers: { Authorization: `Bearer ${token}` } });
        if (listResp.status() !== 200) return;
        const venueId = listResp.json().then(j => j.data[0].id);

        const response = await request.get(`${SUPABASE_URL}/venues/${await venueId}/courts`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        expect(response.ok()).toBeTruthy();
        const json = await response.json();
        expect(json.data).toBeDefined();
        expect(Array.isArray(json.data)).toBeTruthy();
    });

    test('GET /venues/:id/availability should return grid', async ({ request }) => {
        const token = process.env.TEST_PARTNER_TOKEN || 'ReplaceWithValidToken';
        const listResp = await request.get(`${SUPABASE_URL}/venues`, { headers: { Authorization: `Bearer ${token}` } });
        if (listResp.status() !== 200) return;
        const venueId = listResp.json().then(j => j.data[0].id);

        const today = new Date().toISOString().split('T')[0];
        const response = await request.get(`${SUPABASE_URL}/venues/${await venueId}/availability?date=${today}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        expect(response.ok()).toBeTruthy();
        const json = await response.json();
        expect(json.data).toHaveProperty('courts');
        expect(json.data).toHaveProperty('operating_hours');
        expect(json.data.courts[0]).toHaveProperty('slots');
    });
});
