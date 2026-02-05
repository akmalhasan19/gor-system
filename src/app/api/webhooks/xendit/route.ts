import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyXenditWebhook } from '@/lib/xendit-webhook-validator';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            persistSession: false,
        },
    }
);

export async function POST(req: Request) {
    try {
        // Get raw body for signature verification (must be done before JSON parsing)
        const rawBody = await req.text();

        // Get signature headers
        const callbackSignature = req.headers.get('x-callback-signature');
        const callbackToken = req.headers.get('x-callback-token');
        const webhookSecret = process.env.XENDIT_WEBHOOK_SECRET;
        const validToken = process.env.XENDIT_CALLBACK_TOKEN;

        console.log('[Xendit Webhook] Received webhook');
        console.log('[Xendit Webhook] Headers:', {
            'x-callback-signature': callbackSignature ? '(present)' : '(missing)',
            'x-callback-token': callbackToken ? '(present)' : '(missing)',
            'content-length': req.headers.get('content-length')
        });
        console.log('[Xendit Webhook] Config:', {
            'XENDIT_WEBHOOK_SECRET': webhookSecret ? '(configured)' : '(missing)',
            'XENDIT_CALLBACK_TOKEN': validToken ? '(configured)' : '(missing)'
        });

        // Try HMAC signature verification first (more secure)
        if (webhookSecret) {
            console.log('[Xendit Webhook] Verifying via Signature...');
            // Parse body to get timestamp for replay attack prevention
            let body: any;
            try {
                body = JSON.parse(rawBody);
            } catch {
                console.error('[Xendit Webhook] Invalid JSON body');
                return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
            }

            const verification = verifyXenditWebhook(
                rawBody,
                callbackSignature,
                webhookSecret,
                body.created || body.updated // Use available timestamp
            );

            if (!verification.valid) {
                console.warn('[Xendit Webhook] Verification failed:', verification.error);
                // Log expected vs received for debugging (be careful with secrets in prod logs usually, but helpful here)
                // console.log('Expected:', verification.expected);
                // console.log('Received:', verification.received);
                return NextResponse.json({ error: 'Unauthorized', details: verification.error }, { status: 401 });
            }
            console.log('[Xendit Webhook] Signature verified successfully');
        } else if (validToken) {
            console.log('[Xendit Webhook] Verifying via Token...');
            // Fallback to token validation if signature not configured
            if (callbackToken !== validToken) {
                console.warn('[Xendit Webhook] Invalid Xendit Callback Token');
                console.warn(`[Xendit Webhook] Received: ${callbackToken}, Expected: ${validToken}`);
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            console.log('[Xendit Webhook] Token verified successfully');
        } else {
            console.warn('[Xendit Webhook] No verification method configured (Secret or Token missing)');
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        // Parse the body (already parsed above if signature verification was used)
        let body: any;
        try {
            body = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        console.log('Xendit Webhook:', JSON.stringify(body, null, 2));

        const externalId = body.external_id;
        const status = body.status; // 'PAID', 'COMPLETED', 'ACTIVE', 'EXPIRED', 'FAILED'

        if (!externalId) {
            return NextResponse.json({ message: 'No external_id provided' }, { status: 200 });
        }

        // Find the payment
        const { data: payment, error } = await supabaseAdmin
            .from('payments')
            .select('*')
            .eq('external_id', externalId)
            .single();

        if (error || !payment) {
            console.warn('Payment not found for external_id:', externalId);
            // Don't return yet! PWA bookings might not have a payment record.
            // We will attempt to update the booking directly in the IS_PAID block below.
        }

        // Check for success status
        // For Virtual Accounts, the event is usually just a payment notification. 
        // We assume any payment callback with amount > 0 is a success for VA.
        // For QR codes, status must be 'COMPLETED' or 'PAID'.

        let isPaid = false;
        if (status === 'COMPLETED' || status === 'PAID' || status === 'SETTLED') {
            isPaid = true;
        } else if (body.amount && payment?.payment_method === 'VA') {
            // Callback for VA usually implies payment received
            isPaid = true;
        }

        if (isPaid) {
            // Update Payment Status (If payment record exists)
            if (payment) {
                const { error: updateError } = await supabaseAdmin
                    .from('payments')
                    .update({
                        status: 'PAID',
                        updated_at: new Date().toISOString(),
                        metadata: body
                    })
                    .eq('id', payment.id);

                if (updateError) throw updateError;

                // Map payment method for transaction
                let transactionMethod = 'TRANSFER';
                if (payment.payment_method === 'QRIS') transactionMethod = 'QRIS';

                // Update Transaction Status
                const { error: txnError } = await supabaseAdmin
                    .from('transactions')
                    .update({
                        status: 'PAID',
                        payment_method: transactionMethod,
                        paid_amount: body.amount || payment.amount, // Use actual paid amount if available
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', payment.transaction_id);

                if (txnError) throw txnError;

                console.log(`Payment ${payment.id} and Transaction ${payment.transaction_id} updated to PAID`);

                // Fetch transaction items to update related bookings
                const { data: items, error: itemsError } = await supabaseAdmin
                    .from('transaction_items')
                    .select('*')
                    .eq('transaction_id', payment.transaction_id);

                if (!itemsError && items && items.length > 0) {
                    for (const item of items) {
                        if (item.type === 'BOOKING' && item.reference_id) {
                            await supabaseAdmin
                                .from('bookings')
                                .update({
                                    status: 'LUNAS',
                                    paid_amount: item.price, // Assuming full payment for the item
                                    in_cart_since: null
                                })
                                .eq('id', item.reference_id);
                            console.log(`Booking ${item.reference_id} status updated to LUNAS`);
                        }
                    }
                    // Return success here since we handled the "normal" flow
                    return NextResponse.json({ success: true });
                }
            }

            // FALLBACK / DIRECT BOOKING UPDATE
            // Reachable if:
            // 1. Payment record missing (PWA case)
            // 2. Payment exists but no transaction items (Rare)

            console.log('[Xendit Webhook] Trying direct booking update (PWA Fallback)...');

            let bookingId: string | null = null;

            // Try to extract booking ID from external_id
            if (externalId.startsWith('booking-') || externalId.startsWith('BOOKING-')) {
                bookingId = externalId.replace(/^(booking-|BOOKING-)/i, '');
            } else if (externalId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                // external_id is a UUID, might be the booking_id itself
                bookingId = externalId;
            }

            if (bookingId) {
                const { data: booking, error: bookingError } = await supabaseAdmin
                    .from('bookings')
                    .select('id, status, paid_amount, price, venue_id')
                    .eq('id', bookingId)
                    .single();

                if (booking && !bookingError) {
                    const paidAmount = body.amount || body.paid_amount || (payment ? payment.amount : 0);
                    // Use booking.price as the recorded revenue amount as per user request to exclude admin fees
                    // If booking.price is 0 (shouldn't happen for paid bookings), fallback to actual paid amount
                    const revenueAmount = booking.price > 0 ? booking.price : paidAmount;

                    const { error: updateBookingError } = await supabaseAdmin
                        .from('bookings')
                        .update({
                            status: 'LUNAS',
                            paid_amount: revenueAmount, // Use revenue amount for consistency
                            in_cart_since: null
                        })
                        .eq('id', bookingId);

                    if (!updateBookingError) {
                        console.log(`[Xendit Webhook] PWA Booking ${bookingId} updated to LUNAS with revenue_amount: ${revenueAmount} (Paid: ${paidAmount})`);

                        // CREATE TRANSACTION FOR REVENUE TRACKING
                        try {
                            // 1. Create Transaction
                            const { data: newTxn, error: newTxnError } = await supabaseAdmin
                                .from('transactions')
                                .insert({
                                    venue_id: booking.venue_id, // We need venue_id from booking
                                    total_amount: revenueAmount,
                                    paid_amount: revenueAmount,
                                    change_amount: 0,
                                    payment_method: 'TRANSFER', // Assume Transfer/Xendit for PWA
                                    status: 'PAID',
                                    cashier_name: 'System (PWA)',
                                    updated_at: new Date().toISOString()
                                    // metadata column is now available via migration
                                })
                                .select()
                                .single();

                            if (newTxnError) {
                                console.error('[Xendit Webhook] Failed to create transaction:', newTxnError);
                            } else if (newTxn) {
                                // 2. Create Transaction Item
                                const { error: newItemError } = await supabaseAdmin
                                    .from('transaction_items')
                                    .insert({
                                        transaction_id: newTxn.id,
                                        type: 'BOOKING',
                                        name: `Booking PWA ${bookingId?.substring(0, 8)}`, // Short ID
                                        price: revenueAmount,
                                        quantity: 1,
                                        subtotal: revenueAmount,
                                        reference_id: bookingId
                                    });

                                if (newItemError) {
                                    console.error('[Xendit Webhook] Failed to create transaction item:', newItemError);
                                } else {
                                    console.log(`[Xendit Webhook] Transaction ${newTxn.id} created for Booking ${bookingId}`);
                                }
                            }
                        } catch (txnCatchedError) {
                            console.error('[Xendit Webhook] Error creating transaction:', txnCatchedError);
                        }

                        return NextResponse.json({ success: true, message: "Booking updated directly" });
                    } else {
                        console.error(`[Xendit Webhook] Failed to update PWA booking ${bookingId}:`, updateBookingError);
                        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
                    }
                } else {
                    console.warn(`[Xendit Webhook] Booking not found for ID: ${bookingId}`);
                    // If neither payment nor booking found, then it's truly not found
                    if (!payment) {
                        return NextResponse.json({ message: 'Payment and Booking not found' }, { status: 200 });
                    }
                }
            } else {
                console.warn(`[Xendit Webhook] Could not extract booking ID from external_id: ${externalId}`);
                if (!payment) {
                    return NextResponse.json({ message: 'Payment not found and external_id not a booking ID' }, { status: 200 });
                }
            }


        } else if (status === 'EXPIRED' || status === 'FAILED') {
            await supabaseAdmin
                .from('payments')
                .update({
                    status: status,
                    updated_at: new Date().toISOString(),
                    metadata: body
                })
                .eq('id', payment.id);

            // Optionally update transaction to FAILED or CANCELLED if supported
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('Webhook Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
