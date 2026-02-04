/// <reference lib="deno.ns" />

import { createClient } from '@supabase/supabase-js'

// Configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req: Request) => {
    const { method } = req;

    // Only allow POST requests (triggers)
    if (method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        console.log('Starting cleanup-expired-bookings function...');

        // 1. Get all venues to know their settings (bookingTolerance, minDp)
        const { data: venues, error: venuesError } = await supabase
            .from('venues')
            .select('id, booking_tolerance, min_dp_percentage, name');

        if (venuesError) throw venuesError;

        let deletedCount = 0;
        const errors = [];

        // 2. Iterate each venue and delete expired bookings
        for (const venue of venues) {
            const toleranceMinutes = venue.booking_tolerance || 15;
            const minDpPercentage = venue.min_dp_percentage || 50;

            // Calculate cutoff time
            const cutoffTime = new Date(Date.now() - toleranceMinutes * 60 * 1000).toISOString();

            // Find bookings that:
            // - Are NOT 'LUNAS'
            // - Are for this venue
            // - Created BEFORE cutoffTime
            // - in_cart_since is NULL (not in cart)

            // NOTE: We also need to check DP. Supabase Query can't easily do math checks (paid / price) directly in simple select 
            // without using a view or RPC.
            // So we fetch potential expired candidates and filter them in JS.

            const { data: candidates, error: candidatesError } = await supabase
                .from('bookings')
                .select('id, status, price, paid_amount, created_at, in_cart_since, customer_name')
                .eq('venue_id', venue.id)
                .neq('status', 'LUNAS')
                .is('in_cart_since', null)
                .lt('created_at', cutoffTime);

            if (candidatesError) {
                console.error(`Error fetching candidates for venue ${venue.name}:`, candidatesError);
                errors.push({ venue: venue.name, error: candidatesError });
                continue;
            }

            const toDelete = candidates.filter(b => {
                const price = Number(b.price) || 0;
                const paid = Number(b.paid_amount) || 0;
                const percent = price > 0 ? (paid / price) * 100 : 0;

                return percent < minDpPercentage;
            });

            if (toDelete.length > 0) {
                const ids = toDelete.map(b => b.id);
                const { error: deleteError } = await supabase
                    .from('bookings')
                    .delete()
                    .in('id', ids);

                if (deleteError) {
                    console.error(`Failed to delete for venue ${venue.name}:`, deleteError);
                    errors.push({ venue: venue.name, error: deleteError });
                } else {
                    console.log(`Deleted ${toDelete.length} bookings for venue ${venue.name}`);
                    deletedCount += toDelete.length;
                }
            }
        }

        return new Response(
            JSON.stringify({
                message: 'Cleanup completed',
                deletedCount,
                errors: errors.length > 0 ? errors : undefined
            }),
            { headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Unexpected error:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
})
