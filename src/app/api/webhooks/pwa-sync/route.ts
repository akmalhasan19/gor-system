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
        const payload = JSON.parse(rawBody);

        console.log('[PWA Sync] Processing event:', payload.event, 'for booking:', payload.booking_id);

        const {
            venue_id,
            booking_id,
            total_amount,
            paid_amount,
            payment_method,
            payment_status,
            customer_name,
            customer_phone,
            items, // Array of items
            status,             // Fallback
            payment_details     // Fallback
        } = payload;


        // Validate required fields (booking_id is mainly what we had before, but now we probably want venue_id too for transaction)
        if (!booking_id) {
            return NextResponse.json(
                { error: 'Missing booking_id' },
                { status: 400 }
            );
        }

        // 1. UPDATE BOOKING (Legacy & Core logic)
        // Check if booking exists
        const { data: existingBooking, error: fetchError } = await supabaseAdmin
            .from('bookings')
            .select('id, status, paid_amount, venue_id')
            .eq('id', booking_id)
            .single();

        if (fetchError || !existingBooking) {
            console.error('[PWA Sync] Booking not found:', booking_id);
            // If booking not found, maybe we shouldn't create transaction? 
            // Or maybe we should? But for now let's return 404 to be safe.
            return NextResponse.json(
                { error: 'Booking not found' },
                { status: 404 }
            );
        }

        const targetVenueId = venue_id || existingBooking.venue_id;

        // Prepare booking update data
        const updateData: Record<string, any> = {};
        if (status) updateData.status = status;
        if (paid_amount !== undefined) updateData.paid_amount = paid_amount;
        if (payment_method) updateData.payment_method = payment_method;
        if (payment_details) updateData.payment_details = payment_details;
        updateData.in_cart_since = null; // Clear cart timer

        // Update booking
        const { error: updateError } = await supabaseAdmin
            .from('bookings')
            .update(updateData)
            .eq('id', booking_id);

        if (updateError) {
            console.error('[PWA Sync] Failed to update booking:', updateError);
            throw updateError;
        }

        // 2. CREATE TRANSACTION (New Logic for Revenue)
        // Only create if paid_amount > 0 and status indicates success
        const isPaidInfo = (status === 'LUNAS' || status === 'PAID' || payment_status === 'PAID' || payload.event === 'booking.paid');

        if (isPaidInfo && paid_amount > 0) {
            // Check if transaction already exists for this booking ID
            const { data: existingItems } = await supabaseAdmin
                .from('transaction_items')
                .select('transaction_id')
                .eq('reference_id', booking_id)
                .eq('type', 'BOOKING')
                .maybeSingle();

            if (!existingItems) {
                console.log(`[PWA Sync] Creating transaction for booking ${booking_id}...`);

                // Create Transaction
                const { data: transaction, error: txnError } = await supabaseAdmin
                    .from('transactions')
                    .insert({
                        venue_id: targetVenueId,
                        total_amount: total_amount || paid_amount, // Default to paid amount if total missing
                        paid_amount: paid_amount,
                        payment_method: payment_method || 'TRANSFER',
                        status: 'PAID',
                        customer_name: customer_name || 'PWA User',
                        customer_phone: customer_phone,
                        metadata: { source: 'PWA', booking_id: booking_id, ...payment_details }
                    })
                    .select()
                    .single();

                if (txnError) {
                    console.error('[PWA Sync] Failed to create transaction:', txnError);
                    // Don't fail the whole request, as booking update succeeded
                } else {
                    // Create Transaction Item
                    const itemData = {
                        transaction_id: transaction.id,
                        reference_id: booking_id,
                        type: 'BOOKING',
                        name: items && items[0] ? items[0].name : `Booking ${customer_name || ''}`,
                        quantity: 1,
                        price: total_amount || paid_amount,
                        subtotal: total_amount || paid_amount,
                        price_at_moment: total_amount || paid_amount
                    };

                    const { error: itemError } = await supabaseAdmin
                        .from('transaction_items')
                        .insert(itemData);

                    if (itemError) console.error('[PWA Sync] Failed to create transaction item:', itemError);
                    else console.log(`[PWA Sync] Transaction created: ${transaction.id}`);
                }
            } else {
                console.log(`[PWA Sync] Transaction for booking ${booking_id} already exists.`);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Booking synced and transaction created',
            booking_id: booking_id
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
