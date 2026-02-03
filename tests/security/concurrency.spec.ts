import { test, expect } from '@playwright/test';

/**
 * Concurrency Test for Booking System
 * 
 * Purpose: Verify that the PostgreSQL exclusion constraint prevents double-booking
 * when multiple requests arrive simultaneously for the same time slot.
 * 
 * Expected behavior:
 * - Multiple concurrent requests for the exact same slot
 * - Exactly 1 should succeed (201 Created)
 * - All others should fail (409 Conflict)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_SMASH_API_BASE_URL || 'http://localhost:3000/api/v1';

test.describe('Booking Concurrency (Race Condition Prevention)', () => {

    test('should prevent double-booking when 5 requests arrive simultaneously', async ({ request }) => {
        const token = process.env.TEST_PARTNER_TOKEN;
        if (!token) {
            console.log('Skipping test: TEST_PARTNER_TOKEN not set');
            return;
        }

        // 1. Get a venue and court to test with
        const venuesResponse = await request.get(`${API_BASE_URL}/venues`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!venuesResponse.ok()) {
            console.log('Skipping test: Could not fetch venues');
            return;
        }
        const venues = await venuesResponse.json();
        if (!venues.data || venues.data.length === 0) {
            console.log('Skipping test: No venues available');
            return;
        }

        const venueId = venues.data[0].id;

        // Get courts for this venue
        const courtsResponse = await request.get(`${API_BASE_URL}/venues/${venueId}/courts`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!courtsResponse.ok()) {
            console.log('Skipping test: Could not fetch courts');
            return;
        }
        const courts = await courtsResponse.json();
        if (!courts.data || courts.data.length === 0) {
            console.log('Skipping test: No courts available');
            return;
        }

        const courtId = courts.data[0].id;

        // 2. Create a unique booking payload (future date/time to avoid real conflicts)
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7); // Book for a week from now
        const bookingDate = futureDate.toISOString().split('T')[0];
        const startTime = '22:00'; // Late night slot, likely to be free

        const bookingPayload = {
            venue_id: venueId,
            court_id: courtId,
            booking_date: bookingDate,
            start_time: startTime,
            duration: 1,
            customer_name: 'Concurrency Test User',
            phone: '0812' + Math.random().toString().slice(2, 10), // Random phone for each test run
        };

        // 3. Fire 5 concurrent POST requests
        const concurrentRequests = Array(5).fill(null).map(() =>
            request.post(`${API_BASE_URL}/bookings`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                data: bookingPayload
            })
        );

        const results = await Promise.all(concurrentRequests);
        const statusCodes = results.map(r => r.status());

        console.log('Concurrent booking status codes:', statusCodes);

        // 4. Verify results: Exactly 1 success (201), rest should be conflicts (409)
        const successCount = statusCodes.filter(s => s === 201).length;
        const conflictCount = statusCodes.filter(s => s === 409).length;

        expect(successCount).toBe(1); // Only ONE booking should succeed
        expect(conflictCount).toBe(4); // The other 4 should be conflicts
    });
});
