/**
 * PWA Sync Webhook Endpoint
 * 
 * Receives booking sync updates from PWA (smashcourts.online) after payment.
 * Uses HMAC signature verification instead of JWT for authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPwaWebhook } from '@/lib/pwa-webhook-validator';
import { createClient } from '@supabase/supabase-js';

// Create admin client for database operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PwaSyncPayload {
    event: 'booking.paid' | 'booking.updated';
    booking_id: string;
    status: string;
    paid_amount: number;
    payment_method?: string;
    payment_details?: Record<string, any>;
    timestamp: string;
}

export async function POST(req: NextRequest) {
    console.log('[PWA Sync] Received webhook request');

    try {
        // Get raw body for signature verification
        const rawBody = await req.text();

        // Get signature from header
        const signature = req.headers.get('x-pwa-signature');

        // Get webhook secret
        const secret = process.env.PWA_WEBHOOK_SECRET || '';

        // Verify signature
        const verification = verifyPwaWebhook(rawBody, signature, secret);

        if (!verification.valid) {
            console.error('[PWA Sync] Verification failed:', verification.error);
            return NextResponse.json(
                { error: verification.error },
                { status: 401 }
            );
        }

        console.log('[PWA Sync] Signature verified successfully');

        // Parse payload
        const payload: PwaSyncPayload = JSON.parse(rawBody);

        console.log('[PWA Sync] Processing event:', payload.event, 'for booking:', payload.booking_id);

        // Validate required fields
        if (!payload.booking_id) {
            return NextResponse.json(
                { error: 'Missing booking_id' },
                { status: 400 }
            );
        }

        // Check if booking exists
        const { data: existingBooking, error: fetchError } = await supabaseAdmin
            .from('bookings')
            .select('id, status, paid_amount')
            .eq('id', payload.booking_id)
            .single();

        if (fetchError || !existingBooking) {
            console.error('[PWA Sync] Booking not found:', payload.booking_id);
            return NextResponse.json(
                { error: 'Booking not found' },
                { status: 404 }
            );
        }

        console.log('[PWA Sync] Current booking state:', {
            id: existingBooking.id,
            status: existingBooking.status,
            paid_amount: existingBooking.paid_amount
        });

        // Prepare update data
        const updateData: Record<string, any> = {};

        if (payload.status) {
            updateData.status = payload.status;
        }

        if (payload.paid_amount !== undefined) {
            updateData.paid_amount = payload.paid_amount;
        }

        if (payload.payment_method) {
            updateData.payment_method = payload.payment_method;
        }

        if (payload.payment_details) {
            updateData.payment_details = payload.payment_details;
        }

        // Update booking
        const { error: updateError } = await supabaseAdmin
            .from('bookings')
            .update(updateData)
            .eq('id', payload.booking_id);

        if (updateError) {
            console.error('[PWA Sync] Failed to update booking:', updateError);
            return NextResponse.json(
                { error: 'Failed to update booking' },
                { status: 500 }
            );
        }

        console.log('[PWA Sync] Booking updated successfully:', {
            booking_id: payload.booking_id,
            new_status: payload.status,
            new_paid_amount: payload.paid_amount
        });

        return NextResponse.json({
            success: true,
            message: 'Booking synced successfully',
            booking_id: payload.booking_id
        });

    } catch (error: any) {
        console.error('[PWA Sync] Error processing webhook:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// Health check / info endpoint
export async function GET() {
    return NextResponse.json({
        endpoint: '/api/webhooks/pwa-sync',
        description: 'PWA Booking Sync Webhook',
        methods: ['POST'],
        headers: {
            required: ['x-pwa-signature'],
            description: 'HMAC-SHA256 signature of the request body'
        }
    });
}
